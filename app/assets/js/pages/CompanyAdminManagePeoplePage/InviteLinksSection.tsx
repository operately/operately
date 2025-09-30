import React from "react";
import * as InviteLinks from "@/models/inviteLinks";
import * as Time from "@/utils/time";
import { PrimaryButton, SecondaryButton, GhostButton } from "turboui";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import Modal, { ModalState, useModalState } from "@/components/Modal";
import { createTestId } from "@/utils/testid";

interface InviteLinksSectionProps {
  companyId: string;
}

export function InviteLinksSection({ companyId }: InviteLinksSectionProps) {
  const { data: inviteLinksData, refetch } = InviteLinks.useListInviteLinks({ companyId });
  const [createInviteLink, { loading: creating }] = InviteLinks.useCreateInviteLink();
  const [revokeInviteLink] = InviteLinks.useRevokeInviteLink();

  const createLinkModal = useModalState();
  const [newLink, setNewLink] = React.useState<InviteLinks.InviteLink | null>(null);

  const inviteLinks = inviteLinksData?.inviteLinks || [];

  const handleCreateLink = async () => {
    try {
      const result = await createInviteLink({ companyId });
      if (result.inviteLink) {
        setNewLink(result.inviteLink);
        refetch();
        createLinkModal.show();
      }
    } catch (error) {
      console.error("Failed to create invite link:", error);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    if (confirm("Are you sure you want to revoke this invite link? It will no longer work for new invitations.")) {
      try {
        await revokeInviteLink({ inviteLinkId: linkId });
        refetch();
      } catch (error) {
        console.error("Failed to revoke invite link:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invite Links</h3>
          <p className="text-content-dimmed text-sm">
            Generate shareable links to invite team members to join your company.
          </p>
        </div>
        <PrimaryButton onClick={handleCreateLink} loading={creating} testId="create-invite-link">
          Generate New Link
        </PrimaryButton>
      </div>

      {inviteLinks.length === 0 ? (
        <div className="text-center py-8 text-content-dimmed">
          No invite links have been created yet.
        </div>
      ) : (
        <div className="space-y-4">
          {inviteLinks.map((link) => (
            <InviteLinkCard 
              key={link.id} 
              link={link} 
              onRevoke={() => handleRevokeLink(link.id!)} 
            />
          ))}
        </div>
      )}

      <CreateLinkModal 
        link={newLink}
        state={createLinkModal}
        onClose={() => {
          setNewLink(null);
          createLinkModal.hide();
        }}
      />
    </div>
  );
}

interface InviteLinkCardProps {
  link: InviteLinks.InviteLink;
  onRevoke: () => void;
}

function InviteLinkCard({ link, onRevoke }: InviteLinkCardProps) {
  const isExpired = new Date(link.expiresAt!) < new Date();
  const isInactive = !link.isActive;
  const inviteUrl = InviteLinks.createInvitationUrl(link.token!);

  const getStatusBadge = () => {
    if (isInactive) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Revoked</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Active</span>;
  };

  return (
    <div className="border border-surface-outline rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Invite Link</span>
            {getStatusBadge()}
          </div>
          <div className="text-sm text-content-dimmed">
            Created by {link.author?.fullName} on {Time.format(link.insertedAt!, "MMM d, yyyy")}
          </div>
          <div className="text-sm text-content-dimmed">
            Expires on {Time.format(link.expiresAt!, "MMM d, yyyy")} • Used {link.useCount} times
          </div>
        </div>
        <div className="space-x-2">
          {!isInactive && !isExpired && (
            <GhostButton size="sm" onClick={onRevoke} testId={createTestId("revoke-link", link.id!)}>
              Revoke
            </GhostButton>
          )}
        </div>
      </div>

      {!isInactive && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 text-xs font-mono bg-surface-base border border-surface-outline rounded px-2 py-1 break-all">
              {inviteUrl}
            </div>
            <CopyToClipboard text={inviteUrl} size={16} />
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateLinkModalProps {
  link: InviteLinks.InviteLink | null;
  state: ModalState;
  onClose: () => void;
}

function CreateLinkModal({ link, state, onClose }: CreateLinkModalProps) {
  if (!link) return null;

  const inviteUrl = InviteLinks.createInvitationUrl(link.token!);
  const copyMessage = `Join me on Operately! Click this link to get started: ${inviteUrl}`;

  return (
    <Modal title="New Invite Link Created" isOpen={state.isOpen} hideModal={onClose} size="lg">
      <div className="space-y-4">
        <div className="text-green-600 font-medium">
          ✓ Invite link generated successfully!
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-content-accent mb-2">
              Shareable Link (expires in 7 days):
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 text-content-primary border border-surface-outline rounded-lg px-3 py-2 font-mono text-sm break-all bg-surface-base">
                {inviteUrl}
              </div>
              <CopyToClipboard text={inviteUrl} size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-accent mb-2">
              Message Template:
            </label>
            <div className="flex items-start space-x-2">
              <div className="flex-1 text-content-primary border border-surface-outline rounded-lg px-3 py-2 text-sm bg-surface-base">
                {copyMessage}
              </div>
              <CopyToClipboard text={copyMessage} size={20} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <SecondaryButton onClick={onClose}>
            Done
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}