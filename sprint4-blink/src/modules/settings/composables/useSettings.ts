import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/modules/auth/services/auth.service'
import { useUser } from '@/modules/auth/composables/useUser'
import { useToast } from '@/shared/composables/useToast'
import { useI18n } from 'vue-i18n'
import { useTranslateError } from '@/shared/composables/useTranslateError'

export function useSettings() {
  const router = useRouter()
  const toast = useToast()
  const { t } = useI18n()
  const { translateErrorMessage } = useTranslateError()
  const { user, loadUser, updateAvatar, updateUser, avatarUrl } = useUser()
  const fileInput = ref<HTMLInputElement | null>(null)

  // Form fields
  const firstName = ref('')
  const lastName = ref('')
  const email = ref('')

  onMounted(async () => {
    try {
      await loadUser()
      // Load user data into form fields
      if (user.value) {
        const nameParts = user.value.name.split(' ')
        firstName.value = nameParts[0] || ''
        lastName.value = nameParts.slice(1).join(' ') || ''
        email.value = user.value.email
      }
    } catch (_err) {
      toast.error(t('auth.sessionExpired'))
      await authService.logout()
      router.push('/login')
    }
  })

  const handleAvatarClick = () => {
    fileInput.value?.click()
  }

  const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (!file) return
    
    if (file.size > 1024 * 1024) {
      toast.error(t('settings.validation.fileTooLarge'))
      return
    }
    
    if (!['image/jpeg', 'image/gif', 'image/png'].includes(file.type)) {
      toast.error(t('settings.validation.invalidFileType'))
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const newAvatarUrl = e.target?.result as string
      updateAvatar(newAvatarUrl)
      toast.success(t('settings.toast.avatarUpdated'))
    }
    reader.readAsDataURL(file)
  }

  const handlePersonalInfoSubmit = async () => {
    try {
      // Ensure we are updating the currently authenticated user (avoid stale localStorage).
      const me = user.value ?? await loadUser()
      if (!me?.id) {
        toast.error(t('settings.errors.userInfoUnavailable'))
        return
      }

      // Build the full name
      const fullName = `${firstName.value} ${lastName.value}`.trim()

      // Update self profile through the auth endpoint (commonly allowed for role "user").
      // Avoid hitting /v1/users/:id which is frequently admin-protected.
      const updates: { name?: string; email?: string; phone?: string } = {}
      if (fullName) updates.name = fullName
      
      // Always include email if it has a value, trimmed
      const trimmedEmail = email.value.trim()
      if (trimmedEmail) {
        updates.email = trimmedEmail
      }
      
      if (me.phone) updates.phone = me.phone



      const updatedUserData = await authService.updateCurrentUser(updates)
      
      
      // Update local user data
      updateUser(updatedUserData)

      toast.success(t('settings.toast.personalInfoSaved'))
    } catch (error: any) {
      if (error?.status === 403) {
        toast.error(t('settings.errors.profileUpdateForbidden'))
        return
      }
      toast.error(translateErrorMessage(error?.message, t('settings.errors.updateInfo')))
    }
  }

  const handleDeleteAccount = () => {
    toast.error(t('settings.toast.deleteWarning'))
  }

  return {
    avatarUrl,
    fileInput,
    firstName,
    lastName,
    email,
    handleAvatarClick,
    handleAvatarChange,
    handlePersonalInfoSubmit,
    handleDeleteAccount,
  }
}

