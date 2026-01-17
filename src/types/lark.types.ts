// Lark Message Types
export interface LarkMessage {
  msg_type: 'text' | 'post' | 'interactive';
  content?: LarkTextContent;
  card?: LarkCard;
}

// Simple Text Message
export interface LarkTextContent {
  text: string;
}

// Interactive Card Message
export interface LarkCard {
  header?: LarkCardHeader;
  elements: LarkCardElement[];
}

// Card Header
export interface LarkCardHeader {
  title: LarkText;
  template?: 'blue' | 'wathet' | 'turquoise' | 'green' | 'yellow' | 'orange' | 'red' | 'carmine' | 'violet' | 'purple' | 'indigo' | 'grey';
}

// Card Elements
export type LarkCardElement = LarkDivElement | LarkActionElement | LarkNoteElement;

// Div Element (text content)
export interface LarkDivElement {
  tag: 'div';
  text?: LarkText;
  fields?: LarkField[];
}

// Action Element (buttons)
export interface LarkActionElement {
  tag: 'action';
  actions: LarkButton[];
}

// Note Element (footnote)
export interface LarkNoteElement {
  tag: 'note';
  elements: LarkText[];
}

// Text Types
export interface LarkText {
  tag: 'plain_text' | 'lark_md';
  content: string;
}

// Field for multi-column layout
export interface LarkField {
  is_short: boolean;
  text: LarkText;
}

// Button
export interface LarkButton {
  tag: 'button';
  text: LarkText;
  type?: 'default' | 'primary' | 'danger';
  url?: string;
}

// Helper type for constructing messages
export interface LarkMessageBuilder {
  createTextMessage(text: string): LarkMessage;
  createCardMessage(
    title: string,
    content: string,
    template?: LarkCardHeader['template'],
    buttonUrl?: string
  ): LarkMessage;
}
