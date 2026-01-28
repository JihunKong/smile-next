'use client'

import { use } from 'react'
import { useSession } from 'next-auth/react'
import {
  useInvite,
  InvalidInvite,
  AlreadyMember,
  JoinConfirmation,
  RegistrationForm,
  InviteLoading,
} from '@/features/invite'

export default function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: inviteCode } = use(params)
  const { data: session, status } = useSession()

  const { inviteInfo, isLoading, error, isSubmitting, joinGroup, register } =
    useInvite(inviteCode)

  // Loading state
  if (status === 'loading' || isLoading) {
    return <InviteLoading />
  }

  // Invalid invite
  if (!inviteInfo?.valid || !inviteInfo.group) {
    return <InvalidInvite error={error} />
  }

  const group = inviteInfo.group

  // Already a member
  if (inviteInfo.alreadyMember && session) {
    return <AlreadyMember group={group} />
  }

  // Logged in user - show join confirmation
  if (session) {
    return (
      <JoinConfirmation
        group={group}
        userEmail={session.user?.email || ''}
        error={error}
        isSubmitting={isSubmitting}
        onJoin={joinGroup}
      />
    )
  }

  // Not logged in - show registration form
  return (
    <RegistrationForm
      group={group}
      inviteCode={inviteCode}
      error={error}
      isSubmitting={isSubmitting}
      onRegister={register}
    />
  )
}
