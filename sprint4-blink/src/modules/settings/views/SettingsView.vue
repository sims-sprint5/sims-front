<template>
  <AppLayout :title="$t('settings.title')">
    <div class="divide-y divide-gray-200 dark:divide-white/10">
      <!-- Personal Information Section -->
      <div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 class="text-base/7 font-semibold text-main dark:text-inverse">{{ $t('settings.personalInfo') }}</h2>
          <p class="mt-1 text-sm/6 text-muted dark:text-muted">{{ $t('settings.personalInfoDesc') }}</p>
        </div>

        <div class="md:col-span-2 space-y-10">
          <!-- Perfil de usuario -->
          <form @submit.prevent="handlePersonalInfoSubmit">
            <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              <div class="col-span-full flex items-center gap-x-8">
                <img
                  :src="avatarUrl || userLogo"
                  :alt="$t('settings.userAvatarAlt')"
                  class="h-14 w-14 flex-none rounded-full bg-surface-muted object-cover ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10"
                />
                <div>
                  <input 
                    ref="fileInput"
                    type="file" 
                    accept="image/jpeg,image/gif,image/png"
                    style="display: none"
                    @change="handleAvatarChange"
                  />
                  <button 
                    type="button"
                    @click="handleAvatarClick"
                    class="rounded-md bg-surface px-3 py-2 text-sm font-semibold text-main shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-surface-muted dark:bg-surface/10 dark:text-inverse dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-surface/20"
                  >
                    {{ $t('settings.changeAvatar') }}
                  </button>
                  <p class="mt-2 text-xs/5 text-muted dark:text-muted">{{ $t('settings.avatarHelp') }}</p>
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="first-name" class="block text-sm/6 font-medium text-main dark:text-inverse">{{ $t('settings.firstName') }}</label>
                <div class="mt-2">
                  <input 
                    v-model="firstName"
                    type="text" 
                    name="first-name" 
                    id="first-name" 
                    autocomplete="given-name" 
                    class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-main outline-1 -outline-offset-1 outline-gray-300 placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-surface/5 dark:text-inverse dark:outline-white/10 dark:placeholder:text-muted dark:focus:outline-indigo-500" 
                  />
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="last-name" class="block text-sm/6 font-medium text-main dark:text-inverse">{{ $t('settings.lastName') }}</label>
                <div class="mt-2">
                  <input 
                    v-model="lastName"
                    type="text" 
                    name="last-name" 
                    id="last-name" 
                    autocomplete="family-name" 
                    class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-main outline-1 -outline-offset-1 outline-gray-300 placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-surface/5 dark:text-inverse dark:outline-white/10 dark:placeholder:text-muted dark:focus:outline-indigo-500" 
                  />
                </div>
              </div>

              <div class="col-span-full">
                <label for="email" class="block text-sm/6 font-medium text-main dark:text-inverse">{{ $t('settings.email') }}</label>
                <div class="mt-2">
                  <input 
                    v-model="email"
                    id="email" 
                    name="email" 
                    type="email" 
                    autocomplete="email" 
                    class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-main outline-1 -outline-offset-1 outline-gray-300 placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-surface/5 dark:text-inverse dark:outline-white/10 dark:placeholder:text-muted dark:focus:outline-indigo-500" 
                  />
                </div>
              </div>
            </div>

            <div class="mt-8 flex">
              <BaseButton type="submit" variant="primary" size="sm">
                {{ $t('settings.saveChanges') }}
              </BaseButton>
            </div>
          </form>

          <div class="pt-10 border-t border-default dark:border-white/10">
            <h3 class="text-base/7 font-semibold text-main dark:text-inverse">{{ $t('settings.language') }}</h3>
            <p class="mt-1 text-sm/6 text-muted dark:text-muted">{{ $t('settings.languageDesc') }}</p>
            <div class="mt-6">
              <LanguageSelector />
            </div>
          </div>

          <div class="pt-10 border-t border-default dark:border-white/10">
            <h3 class="text-base/7 font-semibold text-main dark:text-inverse">{{ $t('settings.deleteAccount') }}</h3>
            <p class="mt-1 text-sm/6 text-muted dark:text-muted">
              {{ $t('settings.deleteAccountDesc') }}
            </p>
            <form class="mt-6" @submit.prevent="handleDeleteAccount">
              <BaseButton type="submit" variant="tertiary" size="sm">
                {{ $t('settings.deleteAccountCta') }}
              </BaseButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { useSettings } from '@/modules/settings/composables/useSettings';
import AppLayout from '@/layouts/AppLayout.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import userLogo from '@/assets/user_logo.png';

const {
  avatarUrl,
  fileInput,
  firstName,
  lastName,
  email,
  handleAvatarClick,
  handleAvatarChange,
  handlePersonalInfoSubmit,
  handleDeleteAccount,
} = useSettings();

void fileInput;

</script>
