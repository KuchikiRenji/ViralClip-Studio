import type { Message } from './types';
import type { TemplateType } from './types';
import { TEMPLATE_CONFIG, DEFAULT_MESSAGE_DELAY_MS } from './constants';
interface MessageLayout {
  msg: Message;
  width: number;
  height: number;
  x: number;
  y: number;
}
interface CardLayout {
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  headerHeight: number;
  scrollOffset: number;
}
interface ColorScheme {
  cardBgColor: string;
  bubbleBgColor: string;
  textColor: string;
}
const CARD_MARGIN_X = 0.05;
const CARD_MARGIN_Y = 0.2;
const CARD_WIDTH_RATIO = 0.9;
const MAX_CARD_HEIGHT_RATIO = 0.6;
const HEADER_HEIGHT = 80;
const BUBBLE_PADDING = 20;
const BUBBLE_VERTICAL_GAP = 15;
const BUBBLE_MAX_WIDTH_RATIO = 0.7;
const BUBBLE_TEXT_PADDING = 30;
const MIN_BUBBLE_HEIGHT = 50;
const LINE_HEIGHT = 30;
const BUBBLE_ROUNDING = 15;
const CARD_ROUNDING = 20;
const ANIMATION_DURATION = 0.5;
const ANIMATION_Y_OFFSET = 20;
export const calculateMessageLayouts = (
  ctx: CanvasRenderingContext2D,
  visibleMessages: Message[],
  cardWidth: number,
  cardX: number
): MessageLayout[] => {
  ctx.font = '24px Arial';
  const bubbleMaxWidth = cardWidth * BUBBLE_MAX_WIDTH_RATIO;
  return visibleMessages.map(msg => {
    const isLeft = msg.sender === 'left';
    const metrics = ctx.measureText(msg.content);
    const textWidth = Math.min(metrics.width + BUBBLE_TEXT_PADDING, bubbleMaxWidth);
    const lines = Math.ceil(metrics.width / (bubbleMaxWidth - BUBBLE_TEXT_PADDING));
    const bubbleHeight = Math.max(MIN_BUBBLE_HEIGHT, lines * LINE_HEIGHT + BUBBLE_PADDING);
    return {
      msg,
      width: textWidth,
      height: bubbleHeight,
      x: isLeft ? cardX + BUBBLE_PADDING : cardX + cardWidth - BUBBLE_PADDING - textWidth,
      y: 0,
    };
  });
};
export const calculateCardLayout = (
  canvasWidth: number,
  canvasHeight: number,
  messageLayouts: MessageLayout[]
): CardLayout => {
  const cardX = canvasWidth * CARD_MARGIN_X;
  const cardY = canvasHeight * CARD_MARGIN_Y;
  const cardWidth = canvasWidth * CARD_WIDTH_RATIO;
  const maxCardHeight = canvasHeight * MAX_CARD_HEIGHT_RATIO;
  let totalContentHeight = messageLayouts.reduce((sum, layout) => sum + layout.height + BUBBLE_VERTICAL_GAP, 0);
  totalContentHeight += HEADER_HEIGHT;
  let scrollOffset = 0;
  if (totalContentHeight > maxCardHeight) {
    scrollOffset = totalContentHeight - maxCardHeight + BUBBLE_PADDING;
  }
  const cardHeight = Math.min(totalContentHeight, maxCardHeight);
  return {
    cardX,
    cardY,
    cardWidth,
    cardHeight,
    headerHeight: HEADER_HEIGHT,
    scrollOffset,
  };
};
export const getColorScheme = (darkMode: boolean, template: TemplateType): ColorScheme => {
  const config = TEMPLATE_CONFIG[template];
  const cardBgColor = darkMode ? '#18181b' : '#ffffff';
  const bubbleBgColor = darkMode ? '#27272a' : config.bubbleColor.replace('bg-', '') === 'zinc-200' ? '#e4e4e7' : '#f4f4f5';
  const textColor = darkMode ? '#e4e4e7' : '#27272a';
  return { cardBgColor, bubbleBgColor, textColor };
};
export const getReplyBubbleColor = (config: ReturnType<typeof TEMPLATE_CONFIG[TemplateType]>): string => {
  if (config.replyColor.replace('bg-', '').includes('blue')) return '#3b82f6';
  if (config.replyColor.includes('pink')) return '#ec4899';
  if (config.replyColor.includes('emerald')) return '#10b981';
  if (config.replyColor.includes('purple')) return '#a855f7';
  return '#3b82f6';
};
export const calculateAnimationProperties = (
  isLast: boolean,
  currentTime: number,
  messageStartTime: number,
  animation: Message['animation']
): { alpha: number; yOffset: number } => {
  if (!isLast) return { alpha: 1, yOffset: 0 };
  const timeSinceStart = currentTime - messageStartTime;
  const progress = Math.min(1, Math.max(0, timeSinceStart / ANIMATION_DURATION));
  const ease = 1 - (1 - progress) * (1 - progress);
  if (animation === 'fade') {
    return { alpha: ease, yOffset: 0 };
  }
  if (animation === 'slide-up') {
    return { alpha: ease, yOffset: (1 - ease) * ANIMATION_Y_OFFSET };
  }
  return { alpha: 1, yOffset: 0 };
};
export const drawCardBackground = (
  ctx: CanvasRenderingContext2D,
  layout: CardLayout,
  colorScheme: ColorScheme
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(layout.cardX, layout.cardY, layout.cardWidth, layout.cardHeight, CARD_ROUNDING);
  ctx.clip();
  ctx.fillStyle = colorScheme.cardBgColor;
  ctx.fill();
  ctx.fillRect(layout.cardX, layout.cardY, layout.cardWidth, layout.cardHeight);
  ctx.restore();
};
export const drawMessageBubbles = (
  ctx: CanvasRenderingContext2D,
  messageLayouts: MessageLayout[],
  visibleMessages: Message[],
  layout: CardLayout,
  colorScheme: ColorScheme,
  template: TemplateType,
  currentTime: number,
  messageStartTime: number
): void => {
  const config = TEMPLATE_CONFIG[template];
  const replyColor = getReplyBubbleColor(config);
  let currentY = layout.cardY + layout.headerHeight + 10 - layout.scrollOffset;
  messageLayouts.forEach((messageLayout, index) => {
    const isLast = index === visibleMessages.length - 1;
    const isLeft = messageLayout.msg.sender === 'left';
    const { alpha, yOffset } = calculateAnimationProperties(
      isLast,
      currentTime,
      messageStartTime,
      messageLayout.msg.animation
    );
    ctx.globalAlpha = alpha;
    ctx.fillStyle = isLeft ? colorScheme.bubbleBgColor : replyColor;
    ctx.beginPath();
    ctx.roundRect(messageLayout.x, currentY + yOffset, messageLayout.width, messageLayout.height, BUBBLE_ROUNDING);
    ctx.fill();
    ctx.fillStyle = isLeft ? colorScheme.textColor : '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(messageLayout.msg.content, messageLayout.x + BUBBLE_PADDING, currentY + yOffset + 32);
    currentY += messageLayout.height + BUBBLE_VERTICAL_GAP;
    ctx.globalAlpha = 1;
  });
};
export const drawCardHeader = (
  ctx: CanvasRenderingContext2D,
  layout: CardLayout,
  colorScheme: ColorScheme,
  contactName: string,
  darkMode: boolean
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(layout.cardX, layout.cardY, layout.cardWidth, layout.headerHeight, [CARD_ROUNDING, CARD_ROUNDING, 0, 0]);
  ctx.clip();
  ctx.fillStyle = colorScheme.cardBgColor;
  ctx.fillRect(layout.cardX, layout.cardY, layout.cardWidth, layout.headerHeight);
  ctx.fillStyle = darkMode ? '#3f3f46' : '#e5e7eb';
  ctx.fillRect(layout.cardX, layout.cardY + layout.headerHeight - 1, layout.cardWidth, 1);
  ctx.fillStyle = colorScheme.textColor;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(contactName, layout.cardX + 80, layout.cardY + 50);
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(layout.cardX + 40, layout.cardY + 40, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(contactName.charAt(0).toUpperCase(), layout.cardX + 40, layout.cardY + 48);
  ctx.restore();
};
export const findCurrentMessageIndex = (
  messagesWithContent: Message[],
  currentTime: number
): { index: number; startTime: number } => {
  let accumulatedTime = 0;
  let foundIndex = -1;
  let startTime = 0;
  for (let i = 0; i < messagesWithContent.length; i++) {
    const msg = messagesWithContent[i];
    const delay = msg.delay || DEFAULT_MESSAGE_DELAY_MS / 1000;
    if (currentTime >= accumulatedTime) {
      foundIndex = i;
      startTime = accumulatedTime;
    }
    accumulatedTime += delay + 1.5;
  }
  if (foundIndex === -1 && currentTime > 0) {
    foundIndex = messagesWithContent.length - 1;
  }
  return { index: foundIndex, startTime };
};







