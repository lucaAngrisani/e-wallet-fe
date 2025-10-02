export interface MenuItem {
  label: string;
  route: string;
  icon?: string;
  children?: MenuItem[];
  order?: number;
  disabled?: boolean;
  externalLink?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
}
