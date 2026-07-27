import React from 'react';
import { Helmet } from 'react-helmet-async';

/** Inyecta JSON-LD sin pelear con PageMetaProvider. */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      {payload.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item, (_k, v) => (v === undefined ? undefined : v))}
        </script>
      ))}
    </Helmet>
  );
}
