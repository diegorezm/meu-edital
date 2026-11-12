import { ReviewsView } from "./components/ReviewsView";
import { useReviews } from "./hooks/useReviews";

export function ReviewsPage() {
  return <ReviewsView reviews={useReviews()} />;
}
