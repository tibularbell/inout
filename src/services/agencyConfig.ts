export interface AgencyConfig {
  shortName: string;
  fullName: string;
  address: string;
  outgoingPrefix: string;
  directorName: string;
  fiscalYear: number;
}

const STORAGE_KEY_AGENCY = 'banri_saraban_agency_config_v1';

export const DEFAULT_AGENCY_CONFIG: AgencyConfig = {
  shortName: 'รพ.สต.บ้านรี',
  fullName: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
  address: 'ตำบลบ้านรี อำเภอดอนพุด จังหวัดสระบุรี',
  outgoingPrefix: 'สธ ๐๕๑๒.๐๓/',
  directorName: 'นายสมพงษ์ มลิวัลย์',
  fiscalYear: 2570,
};

export function loadAgencyConfig(): AgencyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGENCY);
    if (!raw) return DEFAULT_AGENCY_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AGENCY_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_AGENCY_CONFIG;
  }
}

export function saveAgencyConfig(config: AgencyConfig): AgencyConfig {
  const normalized: AgencyConfig = {
    shortName: config.shortName.trim() || DEFAULT_AGENCY_CONFIG.shortName,
    fullName: config.fullName.trim() || DEFAULT_AGENCY_CONFIG.fullName,
    address: config.address.trim() || DEFAULT_AGENCY_CONFIG.address,
    outgoingPrefix: config.outgoingPrefix.trim() || DEFAULT_AGENCY_CONFIG.outgoingPrefix,
    directorName: config.directorName.trim() || DEFAULT_AGENCY_CONFIG.directorName,
    fiscalYear: Number(config.fiscalYear) || DEFAULT_AGENCY_CONFIG.fiscalYear,
  };
  try {
    localStorage.setItem(STORAGE_KEY_AGENCY, JSON.stringify(normalized));
  } catch {
    // ignore storage errors
  }
  return normalized;
}

export function resetAgencyConfig(): AgencyConfig {
  try {
    localStorage.removeItem(STORAGE_KEY_AGENCY);
  } catch {
    // ignore storage errors
  }
  return DEFAULT_AGENCY_CONFIG;
}
