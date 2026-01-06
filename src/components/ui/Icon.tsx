/**
 * Font Awesome Icon Component
 * Provides consistent icon usage matching Flask's Font Awesome CDN approach
 *
 * Usage:
 *   <Icon name="home" /> - defaults to solid (fas)
 *   <Icon name="user" type="regular" /> - uses far
 *   <Icon name="github" type="brands" /> - uses fab
 *   <Icon name="star" size="lg" className="text-yellow-500" />
 */

interface IconProps {
  name: string
  type?: 'solid' | 'regular' | 'brands' | 'light' | 'duotone'
  size?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl' | '1x' | '2x' | '3x' | '4x' | '5x'
  className?: string
  spin?: boolean
  pulse?: boolean
  fixedWidth?: boolean
}

const typeMap: Record<string, string> = {
  solid: 'fas',
  regular: 'far',
  brands: 'fab',
  light: 'fal',
  duotone: 'fad',
}

export default function Icon({
  name,
  type = 'solid',
  size,
  className = '',
  spin = false,
  pulse = false,
  fixedWidth = false,
}: IconProps) {
  const typeClass = typeMap[type] || 'fas'
  const sizeClass = size ? `fa-${size}` : ''
  const spinClass = spin ? 'fa-spin' : ''
  const pulseClass = pulse ? 'fa-pulse' : ''
  const fwClass = fixedWidth ? 'fa-fw' : ''

  const classes = [
    typeClass,
    `fa-${name}`,
    sizeClass,
    spinClass,
    pulseClass,
    fwClass,
    className,
  ].filter(Boolean).join(' ')

  return <i className={classes} aria-hidden="true" />
}

/**
 * Common Icon Presets matching Flask's icon usage
 */
export const Icons = {
  // Navigation
  home: () => <Icon name="home" />,
  dashboard: () => <Icon name="gauge-high" />,
  groups: () => <Icon name="users" />,
  activities: () => <Icon name="clipboard-list" />,
  messages: () => <Icon name="envelope" />,
  settings: () => <Icon name="cog" />,
  profile: () => <Icon name="user" />,

  // Actions
  add: () => <Icon name="plus" />,
  edit: () => <Icon name="pen" />,
  delete: () => <Icon name="trash" />,
  save: () => <Icon name="save" />,
  cancel: () => <Icon name="times" />,
  search: () => <Icon name="search" />,
  filter: () => <Icon name="filter" />,
  sort: () => <Icon name="sort" />,

  // Status
  check: () => <Icon name="check" className="text-green-500" />,
  error: () => <Icon name="times-circle" className="text-red-500" />,
  warning: () => <Icon name="exclamation-triangle" className="text-yellow-500" />,
  info: () => <Icon name="info-circle" className="text-blue-500" />,
  loading: () => <Icon name="spinner" spin />,

  // Learning Modes
  openMode: () => <Icon name="question-circle" />,
  examMode: () => <Icon name="file-alt" />,
  inquiryMode: () => <Icon name="lightbulb" />,
  caseMode: () => <Icon name="briefcase" />,

  // Bloom's Levels
  remember: () => <Icon name="brain" className="blooms-remember" />,
  understand: () => <Icon name="book-open" className="blooms-understand" />,
  apply: () => <Icon name="wrench" className="blooms-apply" />,
  analyze: () => <Icon name="search-plus" className="blooms-analyze" />,
  evaluate: () => <Icon name="balance-scale" className="blooms-evaluate" />,
  create: () => <Icon name="magic" className="blooms-create" />,

  // Certificate
  certificate: () => <Icon name="certificate" />,
  award: () => <Icon name="award" />,
  medal: () => <Icon name="medal" />,

  // Stats
  chart: () => <Icon name="chart-bar" />,
  analytics: () => <Icon name="chart-line" />,
  leaderboard: () => <Icon name="trophy" />,

  // Social
  like: () => <Icon name="heart" type="regular" />,
  likeFilled: () => <Icon name="heart" className="text-red-500" />,
  comment: () => <Icon name="comment" />,
  share: () => <Icon name="share" />,

  // Auth
  login: () => <Icon name="sign-in-alt" />,
  logout: () => <Icon name="sign-out-alt" />,
  lock: () => <Icon name="lock" />,
  unlock: () => <Icon name="unlock" />,

  // Misc
  external: () => <Icon name="external-link-alt" />,
  download: () => <Icon name="download" />,
  upload: () => <Icon name="upload" />,
  calendar: () => <Icon name="calendar" />,
  clock: () => <Icon name="clock" />,
  star: () => <Icon name="star" />,
  starEmpty: () => <Icon name="star" type="regular" />,
}
