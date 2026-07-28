import { Helmet } from 'react-helmet-async';

/** Meta fija para subdominios internos (bo / ia): no indexar. */
export function InternalNoIndex() {
  return (
    <Helmet>
      <title>Acceso interno</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="description" content="" />
      <link rel="canonical" href="https://www.merceriamatilde.com/" />
    </Helmet>
  );
}
