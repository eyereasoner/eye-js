/* eslint-disable import/no-extraneous-dependencies */
import retry from 'fetch-retry';
import { fetch } from 'cross-fetch';

export const fetchRetry = retry(fetch, {
  retryOn:
  (_: number, error: Error, response: Response) => error !== null || response.status !== 200,
  retryDelay: (attempt: number) => 2 ** attempt * 1000,
  retries: 5,
});
