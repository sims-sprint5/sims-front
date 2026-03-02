import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/modules/auth/services/auth.service'
import { useUser } from '@/modules/auth/composables/useUser'
import { useToast } from '@/shared/composables/useToast'
import { userService } from '@/modules/users/services/user.service'
import { useI18n } from 'vue-i18n'

export function useSettings() {
  const router = useRouter()
  const toast = useToast()
  const { t, te } = useI18n()
  const { user, loadUser, updateAvatar, updateUser, avatarUrl } = useUser()
  const fileInput = ref<HTMLInputElement | null>(null)

  const translateErrorMessage = (message: unknown, fallback: string) => {
    const msg = typeof message === 'string' ? message : ''
    if (msg && te(msg)) return t(msg)
    return msg || fallback
  }

  // Form fields
  const firstName = ref('')
  const lastName = ref('')
  const email = ref('')
  const currentPassword = ref('')

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
      // Intentar obtenir l'id de l'usuari: primer del reactive, després del localStorage
      const userId = user.value?.id ?? authService.getUser()?.id
      const userPhone = user.value?.phone ?? authService.getUser()?.phone ?? ''

      if (!userId) {
        toast.error(t('settings.errors.userInfoUnavailable'))
        return
      }

      // Build the full name
      const fullName = `${firstName.value} ${lastName.value}`.trim()
      
      // Prepare the data to update
      const updateData: any = {
        name: fullName,
        email: email.value,
        phone: userPhone,
      }

      // Only include password if provided
      if (currentPassword.value) {
        updateData.password = currentPassword.value
        updateData.password_confirmation = currentPassword.value
      }

      // Call user service to update user
      const updatedUserData = await userService.updateUser(userId, updateData)
      
      // Update local user data
      updateUser(updatedUserData)

      toast.success(t('settings.toast.personalInfoSaved'))
      currentPassword.value = '' // Clear password field
    } catch (error: any) {
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
    currentPassword,
    handleAvatarClick,
    handleAvatarChange,
    handlePersonalInfoSubmit,
    handleDeleteAccount,
  }
}

