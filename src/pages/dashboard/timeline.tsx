import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { TimelineView } from 'src/sections/timeline/view/timeline-view';

const metadata = { title: `Vremeplov | ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TimelineView />
    </>
  );
}
