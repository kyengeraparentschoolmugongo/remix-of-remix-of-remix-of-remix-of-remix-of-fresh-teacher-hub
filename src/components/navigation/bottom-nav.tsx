import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Download, Film, House } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppChat } from '@/components/whatsapp-chat';
import { InstallCard } from './install-card';

export function BottomNav() {
  const pathname = useLocation({ select: location => location.pathname });
  const entertainment = pathname === '/movies' || pathname.startsWith('/movies/');
  const [installOpen, setInstallOpen] = useState(false);
  const closeInstall = useCallback(() => setInstallOpen(false), []);
  useEffect(closeInstall, [pathname, closeInstall]);

  return <div className="app-bottom-navigation">
    <nav className="app-bottom-nav" aria-label="Main navigation">
      <Button asChild variant="source" size="source" className="app-bottom-tab" data-active={!entertainment}>
        <Link to="/" aria-current={!entertainment ? 'page' : undefined} aria-label="Home — Library" title="Library home">
          <span className="app-bottom-icon"><House aria-hidden="true" /></span><span>Home</span>
        </Link>
      </Button>
      <Button asChild variant="source" size="source" className="app-bottom-tab" data-active={entertainment}>
        <Link to="/movies" aria-current={entertainment ? 'page' : undefined} title="Entertainment — Movies">
          <span className="app-bottom-icon"><Film aria-hidden="true" /></span><span>Entertainment</span>
        </Link>
      </Button>
      <Button variant="source" size="source" className="app-bottom-tab" data-active={installOpen} aria-label="Install the app" aria-haspopup="dialog" aria-expanded={installOpen} title="Install the app" onClick={() => setInstallOpen(value => !value)}>
        <span className="app-bottom-icon"><Download aria-hidden="true" /></span><span>Install</span>
      </Button>
      <WhatsAppChat renderTrigger={({ open, toggle, triggerRef }) =>
        <Button ref={triggerRef} variant="source" size="source" className="app-bottom-tab" data-active={open} aria-label="WhatsApp Help" aria-haspopup="dialog" aria-controls="africavotes-chat" aria-expanded={open} title="WhatsApp Help" onClick={() => { closeInstall(); toggle(); }}>
          <span className="app-bottom-icon"><i className="fa fa-whatsapp" aria-hidden="true" /></span><span>Help</span>
        </Button>
      } />
    </nav>
    <InstallCard open={installOpen} onClose={closeInstall} />
  </div>;
}