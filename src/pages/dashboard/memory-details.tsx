import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { MemoryDetailsView } from 'src/sections/memories/details/memory-details-view';

const metadata = { title: `Detalji uspomene | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MemoryDetailsView />
    </>
  );
}
