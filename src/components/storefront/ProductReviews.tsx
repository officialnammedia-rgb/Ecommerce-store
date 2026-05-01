import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewForm } from "@/components/storefront/ReviewForm";
import { CheckCircle2 } from "lucide-react";

export async function ProductReviews({
  productId,
  signedInUserId,
}: {
  productId: string;
  signedInUserId: string | null;
}) {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const userIds = Array.from(new Set(reviews.map((r) => r.userId)));
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u.name ?? "Customer"]));

  const count = reviews.length;
  const avg = count
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / count
    : 0;
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));

  const myReview = signedInUserId
    ? reviews.find((r) => r.userId === signedInUserId)
    : undefined;

  return (
    <section className="mt-16 border-t pt-12">
      <h2 className="text-2xl font-semibold">Reviews</h2>

      <div className="mt-6 grid md:grid-cols-[280px_1fr] gap-8">
        <div>
          {count > 0 ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold">{avg.toFixed(1)}</span>
                <span className="text-sm text-neutral-500">/ 5</span>
              </div>
              <StarRating value={avg} size={18} className="mt-2" />
              <p className="mt-1 text-sm text-neutral-500">
                Based on {count} {count === 1 ? "review" : "reviews"}
              </p>
              <ul className="mt-4 space-y-1.5">
                {buckets.map((b) => {
                  const pct = count ? (b.n / count) * 100 : 0;
                  return (
                    <li key={b.star} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-neutral-600">{b.star}★</span>
                      <span className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <span
                          className="block h-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-neutral-500">{b.n}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div>
              <p className="text-sm font-semibold">No reviews yet.</p>
              <p className="mt-1 text-sm text-neutral-500">
                Be the first to share your thoughts.
              </p>
            </div>
          )}
          <div className="mt-6">
            <ReviewForm
              productId={productId}
              signedIn={!!signedInUserId}
              initialRating={myReview?.rating}
              initialTitle={myReview?.title}
              initialBody={myReview?.body}
            />
          </div>
        </div>

        <div>
          {count === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
              Tried it on? Tell other shoppers what you think.
            </div>
          ) : (
            <ul className="divide-y">
              {reviews.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <StarRating value={r.rating} size={14} />
                      {r.title && (
                        <p className="mt-1 font-semibold text-sm">{r.title}</p>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {r.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700 whitespace-pre-line">
                    {r.body}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                    <span>{userMap.get(r.userId) ?? "Customer"}</span>
                    {r.orderId && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified buyer
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
