import { getLoadingItems, getLoadingPreset } from "./loading-presets.mjs";

type LoadingPresetName =
  | "home"
  | "login"
  | "mis-rutas"
  | "mis-tareas"
  | "profile"
  | "product-list"
  | "registro-form"
  | "registros"
  | "route-map"
  | "zona-list";

type LoadingScreenProps = {
  presetName: LoadingPresetName;
  title?: string;
};

function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`reporteria-skeleton ${className}`} />;
}

function LoadingAuthScreen({ title }: { title: string }) {
  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9]">
      <section className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9] p-[25px] pb-[calc(25px+env(safe-area-inset-bottom))] pt-[calc(25px+env(safe-area-inset-top))]">
        <div className="flex w-full max-w-[360px] flex-col gap-4">
          <div className="flex w-full justify-center">
            <SkeletonBlock className="h-[120px] w-[120px] rounded-[28px]" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[24px] leading-none font-normal text-[#0D3233]">{title}</p>
            <SkeletonBlock className="h-4 w-full rounded-full" />
          </div>
          <div className="flex flex-col gap-[6px]">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
          </div>
          <div className="flex flex-col gap-[6px]">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
          </div>
          <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
          <SkeletonBlock className="h-4 w-32 self-center rounded-full" />
        </div>
      </section>
    </main>
  );
}

function LoadingAppShell({
  title,
  children,
  contentClassName,
}: {
  title: string;
  children: React.ReactNode;
  contentClassName: string;
}) {
  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#E9EDE9]">
      <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#E9EDE9] px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="flex h-[56px] w-full items-center justify-between rounded-[12px] bg-[#DDE2DD] px-3 py-2">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <p className="m-0 text-[22px] leading-none font-normal text-[#0D3233]">{title}</p>
          </div>
          <SkeletonBlock className="h-6 w-6 rounded-[6px]" />
        </header>

        <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
          <div className={contentClassName}>{children}</div>
        </div>
      </section>
    </main>
  );
}

function LoadingFooterButton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 w-full bg-[#E9EDE9] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
      <SkeletonBlock className="h-11 w-full rounded-[12px]" />
    </div>
  );
}

function LoadingListScreen({
  presetName,
  title,
}: {
  presetName: Exclude<LoadingPresetName, "login" | "route-map" | "registro-form" | "home" | "profile">;
  title: string;
}) {
  const preset = getLoadingPreset(presetName);

  return (
    <LoadingAppShell
      title={title}
      contentClassName="relative flex h-full min-h-0 w-full flex-col pt-4"
    >
      <div className="relative flex h-full min-h-0 w-full flex-col">
        <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 pt-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex w-full flex-col gap-3">
            {preset.showTabs ? (
              <div className="flex h-10 w-full gap-1 rounded-[12px] border border-[#B3B5B3] bg-[#E9EDE9] p-1">
                <SkeletonBlock className="h-full flex-1 rounded-[8px]" />
                <SkeletonBlock className="h-full flex-1 rounded-[8px]" />
              </div>
            ) : null}

            {preset.showTopAction ? (
              <SkeletonBlock className="h-11 w-full rounded-[12px]" />
            ) : null}

            {preset.showInfoCard ? (
              <div className="rounded-[12px] border border-[#B3B5B3] bg-[#E9EDE9] p-3">
                <SkeletonBlock className="h-3 w-28 rounded-full" />
                <SkeletonBlock className="mt-2 h-5 w-3/4 rounded-full" />
              </div>
            ) : null}

            {getLoadingItems(preset.cardCount).map((index) => (
              <div
                key={index}
                className="rounded-[12px] border border-transparent bg-white p-3"
              >
                <SkeletonBlock className="h-4 w-2/3 rounded-full" />
                <SkeletonBlock className="mt-2 h-3 w-1/2 rounded-full" />
                {presetName === "product-list" ? (
                  <>
                    <SkeletonBlock className="mt-2 h-3 w-3/4 rounded-full" />
                    <SkeletonBlock className="mt-3 h-10 w-full rounded-[10px]" />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {preset.showFooterButton ? <LoadingFooterButton /> : null}
      </div>
    </LoadingAppShell>
  );
}

function LoadingRouteMapScreen({ title }: { title: string }) {
  const preset = getLoadingPreset("route-map");

  return (
    <LoadingAppShell
      title={title}
      contentClassName="flex min-h-0 flex-1 w-full flex-col pt-4"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pt-1">
        {preset.showInfoCard ? (
          <div className="rounded-[12px] border border-[#B3B5B3] bg-white px-3 py-2">
            <SkeletonBlock className="h-4 w-2/3 rounded-full" />
            <SkeletonBlock className="mt-2 h-3 w-1/2 rounded-full" />
          </div>
        ) : null}

        {preset.showMap ? (
          <SkeletonBlock className="h-[clamp(180px,42dvh,420px)] w-full rounded-[12px]" />
        ) : null}

        <div className="flex w-full flex-col gap-4 pt-2 pb-2">
          {getLoadingItems(preset.cardCount).map((index) => (
            <SkeletonBlock key={index} className="h-[60px] w-full rounded-[12px]" />
          ))}
        </div>
      </div>
    </LoadingAppShell>
  );
}

function LoadingHomeScreen({ title }: { title: string }) {
  const preset = getLoadingPreset("home");

  return (
    <LoadingAppShell
      title={title}
      contentClassName="flex min-h-0 flex-1 w-full flex-col pt-4"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-[clamp(0.75rem,3vh,2rem)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex min-h-0 flex-col gap-[clamp(0.75rem,3vh,2rem)]">
          {preset.showHero ? (
            <div className="flex w-full justify-center">
              <SkeletonBlock className="h-[clamp(88px,14vh,120px)] w-[clamp(88px,14vh,120px)] rounded-[28px]" />
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-[clamp(0.5rem,2.2vh,1.25rem)]">
            {getLoadingItems(preset.cardCount).map((index) => (
              <SkeletonBlock
                key={index}
                className="h-[clamp(54px,8vh,70px)] w-full rounded-[12px]"
              />
            ))}
          </div>
        </div>

        {preset.showFloatingAction ? (
          <div className="flex w-full items-center justify-center pb-1">
            <SkeletonBlock className="h-[clamp(60px,10vh,80px)] w-[clamp(60px,10vh,80px)] rounded-[28px]" />
          </div>
        ) : null}
      </div>
    </LoadingAppShell>
  );
}

function LoadingRegistroFormScreen({ title }: { title: string }) {
  return (
    <LoadingAppShell
      title={title}
      contentClassName="relative flex h-full min-h-0 flex-1 w-full overflow-hidden pt-4"
    >
      <div className="flex h-full w-full flex-col gap-[15px] overflow-y-auto pb-6">
        <div className="flex flex-col gap-[6px]">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
        </div>
        <div className="flex flex-col gap-[6px]">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
        </div>
        <div className="flex flex-col gap-[6px]">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {getLoadingItems(6).map((index) => (
            <SkeletonBlock key={index} className="aspect-square w-full rounded-[12px]" />
          ))}
        </div>
        <div className="flex flex-col gap-[6px]">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="h-[120px] w-full rounded-[12px]" />
        </div>
        <SkeletonBlock className="h-11 w-full rounded-[12px]" />
        <SkeletonBlock className="h-11 w-full rounded-[12px]" />
      </div>
    </LoadingAppShell>
  );
}

function LoadingProfileScreen({ title }: { title: string }) {
  return (
    <LoadingAppShell
      title={title}
      contentClassName="flex min-h-0 flex-1 w-full flex-col gap-4 pt-4"
    >
      <div className="flex h-full w-full flex-col gap-[15px] overflow-y-auto pb-4">
        <div className="flex w-full items-center gap-3">
          <SkeletonBlock className="h-[88px] w-[88px] rounded-[12px]" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
          </div>
        </div>
        {getLoadingItems(5).map((index) => (
          <div key={index} className="flex flex-col gap-[6px]">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
          </div>
        ))}
        <SkeletonBlock className="h-[44px] w-full rounded-[12px]" />
      </div>
    </LoadingAppShell>
  );
}

export default function LoadingScreen({ presetName, title }: LoadingScreenProps) {
  const preset = getLoadingPreset(presetName);
  const resolvedTitle = title ?? preset.title;

  if (presetName === "login") {
    return <LoadingAuthScreen title={resolvedTitle} />;
  }

  if (presetName === "home") {
    return <LoadingHomeScreen title={resolvedTitle} />;
  }

  if (presetName === "route-map") {
    return <LoadingRouteMapScreen title={resolvedTitle} />;
  }

  if (presetName === "registro-form") {
    return <LoadingRegistroFormScreen title={resolvedTitle} />;
  }

  if (presetName === "profile") {
    return <LoadingProfileScreen title={resolvedTitle} />;
  }

  return <LoadingListScreen presetName={presetName} title={resolvedTitle} />;
}
