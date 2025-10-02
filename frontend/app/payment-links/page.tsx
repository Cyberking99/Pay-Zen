"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Clock, Copy, Globe, LinkIcon, X } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "sonner"
import { getAccessToken } from "@privy-io/react-auth"
import { paymentLinkService } from "@/lib/api"

export default function PaymentLinksPage() {
  const [step, setStep] = useState(1)
  const [linkData, setLinkData] = useState<{
    title: string;
    description: string;
    amount: string;
    fixedAmount: boolean;
    expirationType: 'public' | 'one-time' | 'time-based';
    expirationDate: string;
    customFields: any[];
  }>({
    title: "",
    description: "",
    amount: "",
    fixedAmount: true,
    expirationType: "public",
    expirationDate: "",
    customFields: [],
  })
  const [generatedLink, setGeneratedLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  // Custom fields state and handlers (modal style)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [newField, setNewField] = useState({ name: "", type: "text", required: false, options: "" })

  const handleAddCustomField = () => {
    if (!newField.name.trim()) return
    const field: any = {
      name: newField.name,
      type: newField.type,
      required: newField.required,
    }
    if (newField.type === "select") {
      field.options = newField.options.split(",").map((opt: string) => opt.trim()).filter(Boolean)
    }
    setCustomFields([...customFields, field])
    setNewField({ name: "", type: "text", required: false, options: "" })
  }
  const handleRemoveCustomField = (idx: number) => {
    setCustomFields(customFields.filter((_, i) => i !== idx))
  }

  const generateLink = async () => {
    setLoading(true)
    try {
      const authToken = await getAccessToken()
      if (!authToken) throw new Error("No auth token found")
      const data = await paymentLinkService.createPaymentLink({
        ...(linkData.amount ? { amount: linkData.amount } : {}),
        ...(linkData.title ? { title: linkData.title } : {}),
        description: linkData.description,
        expirationType: linkData.expirationType,
        expiresAt: linkData.expirationType === 'time-based' && linkData.expirationDate ? new Date(linkData.expirationDate).toISOString() : undefined,
        customFields: customFields,
        authToken,
      })
      toast.success("Payment link created!")
      setGeneratedLink((data as any).paymentLink?.url || "")
      setStep(3)
    } catch (err: any) {
      console.log(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setLinkData({
      title: "",
      description: "",
      amount: "",
      fixedAmount: true,
      expirationType: "public",
      expirationDate: "",
      customFields: [],
    })
    setGeneratedLink("")
    setCustomFields([]) // Reset custom fields state
  }

  return (
    <DashboardLayout>
      <div className="w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Payment Links</h1>
            <p className="text-slate-400">Create custom payment links with advanced features</p>
          </div>
          {step > 1 && (
            <Button className="text-white bg-teal-500 hover:bg-teal-600" variant="outline" onClick={() => setStep(1)}>
              ← Back to Form
            </Button>
          )}
        </div>

        {step === 1 && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-6">
              <Card className="glass-effect border-teal-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Link Title</Label>
                    <Input
                      placeholder="e.g., Invoice Payment, Donation, Service Fee"
                      value={linkData.title}
                      onChange={(e) => setLinkData({ ...linkData, title: e.target.value })}
                      className="mt-1 border-teal-500/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      placeholder="Describe what this payment is for"
                      value={linkData.description}
                      onChange={(e) => setLinkData({ ...linkData, description: e.target.value })}
                      className="mt-1 border-teal-500/20 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Amount Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-white">
                    <Switch
                      checked={linkData.fixedAmount}
                      className="text-white bg-teal-500/20"
                      onCheckedChange={(checked) => setLinkData({ ...linkData, fixedAmount: checked })}
                    />
                    <Label className="text-white">Fixed Amount</Label>
                  </div>

                  {linkData.fixedAmount && (
                    <div>
                      <Label className="text-white">Amount (USDC)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={linkData.amount}
                        onChange={(e) => setLinkData({ ...linkData, amount: e.target.value })}
                        className="mt-1 border-teal-500/20 text-white"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-effect border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Expiration Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Expiration Type</Label>
                    <Select
                      value={linkData.expirationType}
                      onValueChange={(value) => setLinkData({ ...linkData, expirationType: value as 'public' | 'one-time' | 'time-based' })}
                    >
                      <SelectTrigger className="mt-1 border-teal-500/20 text-white gradient-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-white bg-slate-900 rounded-lg border border-teal-500/20 shadow-lg">
                        <SelectItem value="public" className="text-white bg-slate-900 hover:bg-teal-900/80 active:bg-teal-900/90 focus:bg-teal-900/90 rounded-md cursor-pointer transition-colors">
                          <div className="flex items-center gap-2 text-white">
                            <Globe className="h-4 w-4" />
                            Public (No Expiration)
                          </div>
                        </SelectItem>
                        <SelectItem value="one-time" className="text-white bg-slate-900 hover:bg-teal-900/80 active:bg-teal-900/90 focus:bg-teal-900/90 rounded-md cursor-pointer transition-colors">
                          <div className="flex items-center gap-2 text-white">
                            <Clock className="h-4 w-4" />
                            One-time Use
                          </div>
                        </SelectItem>
                        <SelectItem value="time-based" className="text-white bg-slate-900 hover:bg-teal-900/80 active:bg-teal-900/90 focus:bg-teal-900/90 rounded-md cursor-pointer transition-colors">
                          <div className="flex items-center gap-2 text-white">
                            <Calendar className="h-4 w-4" />
                            Time-based
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {linkData.expirationType === "time-based" && (
                    <div>
                      <Label className="text-white">Expiration Date</Label>
                      <Input
                        type="datetime-local"
                        value={linkData.expirationDate}
                        onChange={(e) => setLinkData({ ...linkData, expirationDate: e.target.value })}
                        className="mt-1 border-teal-500/20 text-white bg-slate-900"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-white">Custom Fields</CardTitle>
                </CardHeader>
                <CardContent className="text-white">
                  <div className="space-y-2">
                    {customFields.length > 0 && (
                      <ul className="mb-3">
                        {customFields.map((field, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm bg-slate-800/60 rounded px-2 py-1 mb-1">
                            <span className="font-semibold">{field.name}</span>
                            <span className="text-teal-400">({field.type})</span>
                            {field.required && <span className="text-emerald-400">*</span>}
                            {field.type === 'select' && field.options && (
                              <span className="text-slate-400">[{field.options.join(', ')}]</span>
                            )}
                            <Button type="button" size="sm" variant="ghost" className="text-red-400 px-2 py-0" onClick={() => handleRemoveCustomField(idx)}>Remove</Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-3 items-end mt-4">
                      <Input
                        placeholder="Field name"
                        value={newField.name}
                        onChange={e => setNewField(f => ({ ...f, name: e.target.value }))}
                        className="w-32 border border-teal-500/20 text-white bg-transparent px-3 py-2 rounded focus:border-teal-400 focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                      />
                      <select
                        value={newField.type}
                        onChange={e => setNewField(f => ({ ...f, type: e.target.value }))}
                        className="w-28 bg-slate-900 border border-teal-500/20 rounded-lg px-2 py-2 text-base text-white"
                      >
                        <option value="text">Text</option>
                        <option value="select">Select</option>
                        <option value="textarea">Textarea</option>
                      </select>
                      {newField.type === 'select' && (
                        <Input
                          placeholder="Options (comma separated)"
                          value={newField.options}
                          onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
                          className="w-48 border-teal-500/20 text-white bg-slate-900"
                        />
                      )}
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))}
                          className="accent-teal-500"
                        />
                        Required
                      </label>
                      <Button type="button" size="sm" className="bg-emerald-500 text-white px-3 py-1 rounded" onClick={handleAddCustomField}>Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => setStep(2)}
                disabled={!linkData.title || (linkData.fixedAmount && !linkData.amount)}
                className="w-full gradient-primary text-white border-teal-500/20"
              >
                Preview Link
              </Button>
            </div>

            {/* Quick Templates */}
            <div className="space-y-6">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-white">Quick Templates</CardTitle>
                  <CardDescription className="text-slate-400">Start with a pre-configured template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      name: "Invoice Payment",
                      description: "Fixed amount with invoice details",
                      config: {
                        title: "Invoice Payment",
                        description: "Payment for services rendered",
                        fixedAmount: true,
                        amount: "100",
                        expirationType: "time-based",
                        customFields: [
                          { id: 1, type: "text", name: "Invoice Number", required: true },
                          { id: 2, type: "text", name: "Company Name", required: false },
                        ],
                      },
                    },
                    {
                      name: "Donation Link",
                      description: "Variable amount for donations",
                      config: {
                        title: "Support Our Project",
                        description: "Help us continue our work",
                        fixedAmount: false,
                        expirationType: "public",
                        customFields: [
                          { id: 1, type: "text", name: "Donor Name", required: false },
                          { id: 2, type: "textarea", name: "Message", required: false },
                        ],
                      },
                    },
                    {
                      name: "Event Ticket",
                      description: "One-time payment for events",
                      config: {
                        title: "Event Ticket Purchase",
                        description: "Secure your spot at our event",
                        fixedAmount: true,
                        amount: "50",
                        expirationType: "one-time",
                        customFields: [
                          { id: 1, type: "text", name: "Full Name", required: true },
                          {
                            id: 2,
                            type: "select",
                            name: "Ticket Type",
                            required: true,
                            options: ["General", "VIP", "Student"],
                          },
                        ],
                      },
                    },
                  ].map((template) => (
                    <button
                      key={template.name}
                      onClick={() => {
                        setLinkData({
                          ...linkData,
                          ...template.config,
                          expirationType: template.config.expirationType as 'public' | 'one-time' | 'time-based',
                        } as typeof linkData)
                        setCustomFields(template.config.customFields || [])
                      }}
                      className="w-full p-3 text-left rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                    >
                      <p className="font-medium text-white">{template.name}</p>
                      <p className="text-sm text-slate-400">{template.description}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Link Preview</h2>
              <Card className="glass-effect border-teal-500/20">
                <CardHeader>
                  <CardTitle className="text-white">{linkData.title}</CardTitle>
                  <CardDescription className="text-slate-400">{linkData.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">
                      Amount {linkData.fixedAmount ? `($${linkData.amount} USDC)` : "(Variable)"}
                    </Label>
                    <Input
                      type="number"
                      placeholder={linkData.fixedAmount ? linkData.amount : "Enter amount"}
                      disabled={linkData.fixedAmount}
                      className="mt-1 border-teal-500/20 text-white"
                    />
                  </div>

                  {customFields.map((field, idx) => (
                    <div key={idx}>
                      <Label className="text-white">
                        {field.name} {field.required && <span className="text-red-400">*</span>}
                      </Label>
                      {field.type === "text" && (
                        <Input placeholder={`Enter ${(field.label || field.name).toLowerCase()}`} className="mt-1 border-teal-500/20 text-white" />
                      )}
                      {field.type === "textarea" && (
                        <Textarea placeholder={`Enter ${(field.label || field.name).toLowerCase()}`} className="mt-1 border-teal-500/20 text-white" />
                      )}
                      {field.type === "select" && (
                        <Select>
                          <SelectTrigger className="mt-1 border-teal-500/20 text-white gradient-primary">
                            <SelectValue className="text-white" placeholder={`Select ${field.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent className="text-white bg-slate-900 rounded-lg border border-teal-500/20 shadow-lg">
                            {field.options?.map((option: string) => (
                              <SelectItem className="text-white bg-slate-900 hover:bg-teal-900/80 active:bg-teal-900/90 focus:bg-teal-900/90 rounded-md cursor-pointer transition-colors" key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}

                  <Button className="w-full gradient-primary text-white border-teal-500/20" disabled>
                    Pay with PayZen
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Summary */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Configuration Summary</h2>
              <Card className="glass-effect">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Title:</span>
                    <span className="text-white">{linkData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-white">{linkData.fixedAmount ? `$${linkData.amount} USDC` : "Variable"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expiration:</span>
                    <span className="text-white capitalize">{linkData.expirationType.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custom Fields:</span>
                    <span className="text-white">{customFields.length}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-teal-500/20 text-white bg-blue-500 hover:bg-blue-600">
                  Edit
                </Button>
                <Button onClick={generateLink} className="flex-1 gradient-primary text-white border-teal-500/20" disabled={loading}>
                  {loading ? "Generating..." : "Generate Link"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <Card className="glass-effect border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Payment Link Generated!</CardTitle>
                  <CardDescription className="text-slate-400">Your link is ready to share</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white">Payment Link URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={generatedLink} readOnly className="font-mono border-teal-500/20 text-white" />
                  <Button className="text-white bg-teal-500 hover:bg-teal-600" variant="outline" onClick={() => navigator.clipboard.writeText(generatedLink)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button className="text-white bg-teal-500 hover:bg-teal-600" variant="outline" onClick={() => {
                    window.open(generatedLink, '_blank')
                  }}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <p className="text-sm text-slate-400">Link ID</p>
                  <p className="font-mono text-sm text-white">{generatedLink.split("/").pop()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Created</p>
                  <p className="text-sm text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={resetForm} className="flex-1 bg-blue-500 hover:bg-blue-600 border-teal-500/20 text-white">
                  Create Another
                </Button>
                {/* TODO: Add share link functionality */}
                <Button
                  className="flex-1 gradient-primary text-white border-teal-500/20"
                  onClick={async () => {
                    if (!generatedLink) return
                    setShareLoading(true)
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: "Pay me with PayZen",
                          text: "Here's my payment link:",
                          url: generatedLink,
                        })
                        toast.success("Link shared!")
                      } else {
                        await navigator.clipboard.writeText(generatedLink)
                        toast.success("Link copied to clipboard!")
                      }
                    } catch (err) {
                      toast.error("Failed to share link")
                    } finally {
                      setShareLoading(false)
                    }
                  }}
                  disabled={shareLoading}
                >
                  {shareLoading ? "Sharing..." : "Share Link"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
