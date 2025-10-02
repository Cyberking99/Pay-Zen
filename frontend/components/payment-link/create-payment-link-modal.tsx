"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAccessToken } from "@privy-io/react-auth"
import { paymentLinkService } from "@/lib/api"

interface CreatePaymentLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (link: any) => void
}

export function CreatePaymentLinkModal({ open, onOpenChange, onCreated }: CreatePaymentLinkModalProps) {
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [customFields, setCustomFields] = useState<any[]>([])
  const [newField, setNewField] = useState({ name: "", type: "text", required: false, options: "" })
  const [description, setDescription] = useState("")
  const [expiry, setExpiry] = useState("")
  const [loading, setLoading] = useState(false)
  const [expirationType, setExpirationType] = useState<'one-time' | 'time-based' | 'public'>('one-time')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const authToken = await getAccessToken()
      if (!authToken) throw new Error("No auth token found")
      const data = await paymentLinkService.createPaymentLink({
        ...(amount ? { amount } : {}),
        ...(title ? { title } : {}),
        ...(maxUses ? { max_uses: Number(maxUses) } : {}),
        description,
        expirationType,
        expiresAt: expirationType === 'time-based' && expiry ? new Date(expiry).toISOString() : undefined,
        customFields,
        authToken,
      })
      toast.success("Payment link created!")
      onOpenChange(false)
      setAmount("")
      setTitle("")
      setMaxUses("")
      setDescription("")
      setExpiry("")
      setExpirationType('one-time')
      setCustomFields([])
      setNewField({ name: "", type: "text", required: false, options: "" })
      if (onCreated) onCreated(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-2xl shadow-xl p-0">
        <DialogHeader className="bg-gradient-to-r from-teal-400 to-emerald-400 rounded-t-2xl p-6">
          <DialogTitle className="text-white text-2xl font-bold">Create Payment Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <Label htmlFor="title" className="text-gray-700 font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              required
              className="mt-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-base focus:border-teal-500 focus:ring-teal-500 text-black placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="amount" className="text-gray-700 font-medium">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount (optional)"
              className="mt-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-lg focus:border-teal-500 focus:ring-teal-500 text-black placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="maxUses" className="text-gray-700 font-medium">Max Uses</Label>
            <Input
              id="maxUses"
              type="number"
              min="1"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              placeholder="Optional max uses"
              className="mt-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-base focus:border-teal-500 focus:ring-teal-500 text-black placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="mt-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-base focus:border-teal-500 focus:ring-teal-500 text-black placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label className="text-gray-700 font-medium">Custom Fields</Label>
            <div className="space-y-2">
              {customFields.length > 0 && (
                <ul className="mb-2">
                  {customFields.map((field, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm bg-gray-100 rounded px-2 py-1 mb-1">
                      <span className="font-semibold">{field.name}</span>
                      <span className="text-gray-500">({field.type})</span>
                      {field.required && <span className="text-emerald-600">*</span>}
                      {field.type === 'select' && field.options && (
                        <span className="text-gray-400">[{field.options.join(', ')}]</span>
                      )}
                      <Button type="button" size="sm" variant="ghost" className="text-red-500 px-2 py-0" onClick={() => handleRemoveCustomField(idx)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 items-end">
                <Input
                  placeholder="Field name"
                  value={newField.name}
                  onChange={e => setNewField(f => ({ ...f, name: e.target.value }))}
                  className="w-32"
                />
                <select
                  value={newField.type}
                  onChange={e => setNewField(f => ({ ...f, type: e.target.value }))}
                  className="w-28 bg-gray-50 border border-gray-300 rounded-lg px-2 py-2 text-base focus:border-emerald-500 focus:ring-emerald-500 text-black"
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
                    className="w-48"
                  />
                )}
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))}
                  />
                  Required
                </label>
                <Button type="button" size="sm" className="bg-emerald-500 text-white px-3 py-1 rounded" onClick={handleAddCustomField}>Add</Button>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="expirationType" className="text-gray-700 font-medium">Expiration Type</Label>
            <select
              id="expirationType"
              value={expirationType}
              onChange={e => setExpirationType(e.target.value as 'one-time' | 'time-based' | 'public')}
              className="mt-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-base focus:border-emerald-500 focus:ring-emerald-500 text-black"
            >
              <option value="one-time">One-time</option>
              <option value="time-based">Time-based</option>
              <option value="public">Public</option>
            </select>
          </div>
          {expirationType === 'time-based' && (
            <div>
              <Label htmlFor="expiry" className="text-gray-700 font-medium">Expiry Date</Label>
              <Input
                id="expiry"
                type="datetime-local"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                placeholder="Optional expiry"
                className="mt-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-base focus:border-emerald-500 focus:ring-emerald-500 text-black placeholder:text-gray-400"
              />
            </div>
          )}
          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-lg px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-lg px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-md hover:from-teal-600 hover:to-emerald-600">
              {loading ? "Creating..." : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 