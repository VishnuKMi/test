'use client';

import { type PropsWithChildren, useEffect } from 'react';
import {
  initData,
  miniApp,
  useLaunchParams,
  useSignal,
} from '@telegram-apps/sdk-react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { useTelegramMock } from '@/hooks/useTelegramMock';
import { useDidMount } from '@/hooks/useDidMount';
import { useClientOnce } from '@/hooks/useClientOnce';
import { setLocale } from '@/core/i18n/locale';
import { init } from '@/core/init';
import { TrackGroups, TwaAnalyticsProvider } from '@tonsolutions/telemetree-react';
import type { TelegramWebAppData } from '@tonsolutions/telemetree-react';

import './styles.css';

function RootInner({ children }: PropsWithChildren) {
  const isDev = process.env.NODE_ENV === 'development';

  // Mock Telegram environment in development mode if needed.
  if (isDev) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTelegramMock();
  }

  const lp = useLaunchParams();
  const debug = isDev || lp.startParam === 'debug';

  // Initialize the library.
  useClientOnce(() => {
    init(debug);
  });

  const isDark = useSignal(miniApp.isDark);
  const initDataUser = useSignal(initData.user);

  // Set the user locale.
  useEffect(() => {
    initDataUser && setLocale(initDataUser.languageCode);
  }, [initDataUser]);

  const telegramWebAppData: TelegramWebAppData = {
    query_id: initData?.queryId,
    user: initData?.user,
    chat_type: initData?.chatType,
    chat_instance: initData?.chatInstance,
    start_param: initData?.startParam,
    auth_date: initData?.authDate,
    hash: initData?.hash,
    platform: lp?.platform,
  };

  return (
    <TwaAnalyticsProvider
      projectId="42d95b0a-9495-472e-b2bb-7b0dc7c27352"
      apiKey="9f97c59a-8861-4d27-8244-f2eb2d05822f"
      trackGroup={TrackGroups.HIGH}
      telegramWebAppData={telegramWebAppData}
    >
      <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
        <AppRoot
          appearance={isDark ? 'dark' : 'light'}
          platform={['macos', 'ios'].includes(lp.platform) ? 'ios' : 'base'}
        >
          {children}
        </AppRoot>
      </TonConnectUIProvider>
    </TwaAnalyticsProvider>
  );
}

export function Root(props: PropsWithChildren) {
  // Unfortunately, Telegram Mini Apps does not allow us to use all features of
  // the Server Side Rendering. That's why we are showing loader on the server
  // side.
  const didMount = useDidMount();

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  ) : <div className="root__loading">Loading</div>;
}
