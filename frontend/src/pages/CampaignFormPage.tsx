import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useCreateCampaign, useCampaign, useUpdateCampaign } from '@/features/campaigns/hooks'
import { ArrowLeft, Loader2, Mail, FileText, Heading, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FormErrors {
  name?: string
  subject?: string
  body?: string
  recipientEmails?: string
}

export default function CampaignFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  // Form state
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientEmails, setRecipientEmails] = useState('') // Optional field

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Hooks
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  // Fetch existing campaign data when editing
  const { data: campaignData, isLoading: isLoadingCampaign } = useCampaign(id || '')

  // Populate form with existing data when editing
  useEffect(() => {
    if (isEdit && campaignData) {
      setName(campaignData.name || '')
      setSubject(campaignData.subject || '')
      setBody(campaignData.body || '')

      // Populate recipient emails from existing recipients
      if (campaignData.recipients && campaignData.recipients.length > 0) {
        const emails = campaignData.recipients
          .map(r => r.email)
          .join(', ')
        setRecipientEmails(emails)
      } else {
        setRecipientEmails('')
      }
    }
  }, [isEdit, campaignData])

  // Show loading state while fetching campaign data
  if (isEdit && isLoadingCampaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link to="/campaigns" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Link>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading campaign...</span>
          </div>
        </main>
      </div>
    )
  }

  // Validate individual field
  const validateField = (fieldName: keyof FormErrors, value: string) => {
    let error = ''

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = 'Campaign name is required'
        } else if (value.length < 3) {
          error = 'Campaign name must be at least 3 characters'
        } else if (value.length > 100) {
          error = 'Campaign name must not exceed 100 characters'
        }
        break

      case 'subject':
        if (!value.trim()) {
          error = 'Subject line is required'
        } else if (value.length < 3) {
          error = 'Subject must be at least 3 characters'
        } else if (value.length > 200) {
          error = 'Subject must not exceed 200 characters'
        }
        break

      case 'body':
        if (!value.trim()) {
          error = 'Email body is required'
        } else if (value.length < 10) {
          error = 'Email body must be at least 10 characters'
        }
        break

      case 'recipientEmails':
        // Recipients are now optional - only validate if provided
        if (value.trim()) {
          const emails = value.split(',').map(e => e.trim()).filter(e => e)
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

          const invalidEmails = emails.filter(email => !emailRegex.test(email))
          if (invalidEmails.length > 0) {
            error = `Invalid email format: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`
          }
        }
        break
    }

    return error
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors: FormErrors = {}

    newErrors.name = validateField('name', name)
    newErrors.subject = validateField('subject', subject)
    newErrors.body = validateField('body', body)

    // Recipients are optional - only validate if provided
    if (recipientEmails.trim()) {
      newErrors.recipientEmails = validateField('recipientEmails', recipientEmails)
    }

    setErrors(newErrors)

    // Return true if no errors
    return !Object.values(newErrors).some(error => error)
  }

  // Handle field blur for validation
  const handleFieldBlur = (fieldName: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))

    let value = ''
    switch (fieldName) {
      case 'name':
        value = name
        break
      case 'subject':
        value = subject
        break
      case 'body':
        value = body
        break
      case 'recipientEmails':
        value = recipientEmails
        break
    }

    const error = validateField(fieldName, value)
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all required fields as touched (recipientEmails is optional)
    setTouched({
      name: true,
      subject: true,
      body: true,
      recipientEmails: recipientEmails.trim() !== '',
    })

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors).find(key => errors[key as keyof FormErrors])
      if (firstError) {
        const element = document.getElementById(firstError)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }
      return
    }

    try {
      const campaignData = {
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
      }

      if (isEdit && id) {
        // Update existing campaign (note: recipients cannot be updated via edit form)
        await updateCampaign.mutateAsync({
          id,
          data: campaignData,
        })
      } else {
        // Create new campaign with recipient emails
        const emails = recipientEmails
          .split(',')
          .map(e => e.trim())
          .filter(e => e)

        campaignData.recipient_emails = emails.length > 0 ? emails : undefined

        await createCampaign.mutateAsync(campaignData)
      }

      // Redirect to campaigns list on success
      navigate('/campaigns')
    } catch (error) {
      // Error is handled by the mutation hook's onError
      console.error(`Failed to ${isEdit ? 'update' : 'create'} campaign:`, error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/campaigns"
            className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? 'Update your campaign details and content'
              : 'Fill in the details to create a new email campaign'}
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Campaign Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Monthly Newsletter - April 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleFieldBlur('name')}
                  disabled={createCampaign.isPending}
                  className={touched.name && errors.name ? 'border-destructive' : ''}
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  Internal name to identify this campaign (3-100 characters)
                </p>
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-2">
                  <Heading className="h-4 w-4 text-gray-400" />
                  Email Subject
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="e.g., Your April Update is Here!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onBlur={() => handleFieldBlur('subject')}
                  disabled={createCampaign.isPending}
                  className={touched.subject && errors.subject ? 'border-destructive' : ''}
                />
                {touched.subject && errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject}</p>
                )}
                <p className="text-xs text-gray-500">
                  The subject line recipients will see (3-200 characters)
                </p>
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <Label htmlFor="body" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email Content
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="body"
                  placeholder="<html>...</html> or plain text content"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onBlur={() => handleFieldBlur('body')}
                  disabled={createCampaign.isPending}
                  rows={12}
                  className={touched.body && errors.body ? 'border-destructive' : ''}
                />
                {touched.body && errors.body && (
                  <p className="text-sm text-destructive">{errors.body}</p>
                )}
                <p className="text-xs text-gray-500">
                  HTML content for your email. Supports standard HTML tags.
                </p>
              </div>

              {/* Recipient Emails - Only shown when creating */}
              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="recipients" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    Recipient Emails (Optional)
                  </Label>
                  <Textarea
                    id="recipients"
                    placeholder="user1@example.com, user2@example.com"
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                    onBlur={() => handleFieldBlur('recipientEmails')}
                    disabled={createCampaign.isPending}
                    rows={3}
                    className={touched.recipientEmails && errors.recipientEmails ? 'border-destructive' : ''}
                  />
                  {touched.recipientEmails && errors.recipientEmails && (
                    <p className="text-sm text-destructive">{errors.recipientEmails}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Enter email addresses separated by commas.
                  </p>
                  {recipientEmails && !errors.recipientEmails && (
                    <p className="text-xs text-green-600">
                      ✓ {recipientEmails.split(',').filter(e => e.trim()).length} recipient(s)
                    </p>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Link to="/campaigns">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={createCampaign.isPending || updateCampaign.isPending}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createCampaign.isPending || updateCampaign.isPending}
                  className="min-w-[140px]"
                >
                  {(createCampaign.isPending || updateCampaign.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {isEdit ? 'Update Campaign' : 'Create Campaign'}
                    </>
                  )}
                </Button>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {isEdit
                    ? 'Only campaign details (name, subject, body) can be updated. Recipients can only be added during campaign creation.'
                    : 'Campaigns are created as drafts. Add recipients now if needed, then schedule or send from the campaigns list after creation.'}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

