import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { MapView } from 'src/sections/map/view/map-view';

const metadata = { title: `Mapa | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MapView />
    </>
  );
}
