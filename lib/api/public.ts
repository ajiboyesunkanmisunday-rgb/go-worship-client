/**
 * Public pages API — reference data and public event listings.
 *
 * Backend:
 *   GET /public/pages/events/upcoming
 *   GET /public/pages/reference/countries
 *   GET /public/pages/reference/currencies
 *   GET /public/pages/reference/states
 *   GET /public/pages/reference/cities
 */

import { api } from './client';

export type CountryOption = {
  id?: number;
  code?: string;
  iso3?: string;
  name?: string;
  phoneCode?: string;
  currencyCode?: string;
};

export type CurrencyOption = {
  code?: string;
  name?: string;
  symbol?: string;
};

export type LocationPage = {
  items?: { id?: number; name?: string; [key: string]: unknown }[];
  page?: number;
  size?: number;
  hasNext?: boolean;
};

/** GET /public/pages/events/upcoming */
export const getPublicUpcomingEvents = () =>
  api.get<unknown[]>('/public/pages/events/upcoming');

/** GET /public/pages/reference/countries */
export const getPublicCountries = () =>
  api.get<CountryOption[]>('/public/pages/reference/countries');

/** GET /public/pages/reference/currencies */
export const getPublicCurrencies = () =>
  api.get<CurrencyOption[]>('/public/pages/reference/currencies');

/** GET /public/pages/reference/states?countryCode={code} */
export const getPublicStates = (countryCode?: string) =>
  api.get<LocationPage>(
    `/public/pages/reference/states${countryCode ? `?countryCode=${encodeURIComponent(countryCode)}` : ''}`
  );

/** GET /public/pages/reference/cities?stateId={id} */
export const getPublicCities = (stateId?: number) =>
  api.get<LocationPage>(
    `/public/pages/reference/cities${stateId != null ? `?stateId=${stateId}` : ''}`
  );
