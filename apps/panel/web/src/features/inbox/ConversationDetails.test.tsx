import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ConversationDetails } from './ConversationDetails';
import type { Conversation } from './api';

const conversation = {
  displayName: 'Contacto', unreadCount: 0, requiresReview: false,
  historyCoverage: { kind: 'capturing_since', capturingSince: null },
  control: { accessPolicy: 'allowed', automationMode: 'ai', lifecycle: 'open', profileKey: null }
} as Conversation;

afterEach(cleanup);

it('distinguishes a global inherited profile from an explicit contact profile', () => {
  const view = render(<ConversationDetails conversation={conversation} globalProfileKey="ventas" />);
  expect(screen.getByText('ventas · heredado del sistema')).toBeInTheDocument();
  view.rerender(<ConversationDetails conversation={{ ...conversation, control: { ...conversation.control, profileKey: 'soporte' } }} globalProfileKey="ventas" />);
  expect(screen.getByText('soporte · propio')).toBeInTheDocument();
});
