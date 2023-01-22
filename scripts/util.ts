/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-console */
import { fetch } from 'cross-fetch';

export async function fetchRetry(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  let res: Response | undefined;
  let err: unknown | undefined;

  for (let i = 0; i < 5; i += 1) {
    try {
      res = await fetch(input, init);

      if (res.status === 200) return res;
    } catch (e: unknown) {
      err = e;
    }

    if (i < 4) {
      console.warn(`Failed attempt [${i + 1}/5] to fetch ${input}`);
      await new Promise((resolve) => { setTimeout(resolve, 2 ** i * 1000); });
    }
  }

  if (res) {
    return res;
  }

  throw err;
}
