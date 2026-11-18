import Link from "next/link";
import { requireClient } from "@/lib/auth/require";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { supabase, client } = await requireClient();

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthStart = `${monthPrefix}-01`;
  const nextMonthDate = new Date(year, month + 1, 1);
  const monthEnd = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: posts } = await supabase
    .from("posts")
    .select("id, scheduled_date, status, type")
    .eq("client_id", client.id)
    .gte("scheduled_date", monthStart)
    .lt("scheduled_date", monthEnd);

  const postsByDay = new Map<number, NonNullable<typeof posts>>();
  posts?.forEach((p) => {
    if (!p.scheduled_date) return;
    const day = Number(p.scheduled_date.slice(8, 10));
    const arr = postsByDay.get(day) ?? [];
    arr.push(p);
    postsByDay.set(day, arr);
  });

  const thumbByPostId = new Map<string, string>();
  for (const p of posts ?? []) {
    const { data: media } = await supabase
      .from("post_media")
      .select("storage_path")
      .eq("post_id", p.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    if (media?.storage_path) {
      const { data } = await supabase.storage
        .from("post-media")
        .createSignedUrl(media.storage_path, 60 * 60);
      if (data?.signedUrl) thumbByPostId.set(p.id, data.signedUrl);
    }
  }

  const cells = getMonthMatrix(year, month);

  const prevMonth = month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, "0")}`;
  const nextMonth =
    month === 11 ? `${year + 1}-01` : `${year}-${String(month + 2).padStart(2, "0")}`;

  const label = new Date(year, month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold capitalize">{label}</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/portal/calendario?month=${prevMonth}`}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 hover:border-fox-orange"
          >
            ←
          </Link>
          <Link
            href={`/portal/calendario?month=${nextMonth}`}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 hover:border-fox-orange"
          >
            →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dayPosts = day ? (postsByDay.get(day) ?? []) : [];
          const thumb = dayPosts[0] ? thumbByPostId.get(dayPosts[0].id) : undefined;
          return (
            <div
              key={i}
              className={`aspect-square overflow-hidden rounded-md border p-1 text-xs ${
                day ? "border-neutral-200 bg-white" : "border-transparent"
              }`}
            >
              {day && (
                <>
                  <p className="text-neutral-400">{day}</p>
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="mt-1 h-[calc(100%-1rem)] w-full rounded object-cover"
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
