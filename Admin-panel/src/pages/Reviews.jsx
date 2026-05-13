import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGetReviews, useUpdateReviewStatus } from '../hooks/useReviews';

const Reviews = () => {
  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 10;

  // 👉 Send lowercase "pending" to the API to match backend validation
  const apiRating = activeFilter === '5 Stars' ? 5 : undefined;
  const apiStatus = activeFilter === 'Pending' ? 'pending' : undefined;

  // Fetch Data
  const { data, isLoading } = useGetReviews(page, limit, apiRating, apiStatus);
  const { mutate: updateStatus } = useUpdateReviewStatus();

  // Extract from backend response
  const reviews = data?.reviews || [];
  const totalReviews = data?.totalReviews || 0;
  // Removed averageRating

  // 👉 Stat Card counts (Checking against lowercase DB values)
  const publishedCount = reviews.filter(r => r.status === 'published').length;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  const mainRef = useRef(null);
  const statsRef = useRef([]);
  const reviewsRef = useRef([]);

  // Base page entrance animation
  useEffect(() => {
    if (isLoading) return;
    gsap.fromTo(mainRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
    if (statsRef.current.length > 0) {
      gsap.fromTo(statsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 });
    }
  }, [isLoading]);

  // List stagger animation
  useEffect(() => {
    if (reviewsRef.current.length > 0) {
      gsap.fromTo(
        reviewsRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [reviews, searchQuery]);

  // 👉 Toggle Logic (Swaps between lowercase 'published' and 'pending')
  const toggleStatus = (productId, reviewId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'pending' : 'published';
    updateStatus({ productId, reviewId, status: newStatus });
  };

  // Frontend search filter
  const filteredReviews = reviews.filter(review => {
    if (!searchQuery) return reviews;
    const query = searchQuery.toLowerCase();
    return (
      review.userName?.toLowerCase().includes(query) || // changed from review.user to review.userName based on your aggregation
      review.productName?.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query)
    );
  });

  const addToStatsRef = (el) => {
    if (el && !statsRef.current.includes(el)) statsRef.current.push(el);
  };

  const addToReviewsRef = (el) => {
    if (el && !reviewsRef.current.includes(el)) reviewsRef.current.push(el);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0" }}>
        {i < Math.floor(rating) ? 'star' : (i < rating ? 'star_half' : 'star')}
      </span>
    ));
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <main ref={mainRef} className="p-gutter md:p-margin-page max-w-container-max mx-auto w-full pb-20 opacity-0">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-md gap-4">
        <div>
          <h1 className="font-heading text-headline-lg text-on-surface mb-2">Customer Reviews</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage and curate feedback for your artisan creations.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search loaded reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-surface-container-low border-b border-outline-variant focus:border-primary focus:ring-0 focus:outline-none rounded-t-DEFAULT text-on-surface font-body-md text-body-md transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Reviews Summary Bento - Changed to lg:grid-cols-3 to balance the 3 remaining cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-stack-lg">
        <div ref={addToStatsRef} className="bg-surface-container-lowest p-6 rounded-lg border border-surface-variant shadow-[0_4px_20px_-10px_rgba(141,75,0,0.05)]">
          <div className="text-on-surface-variant font-label-sm text-label-sm uppercase mb-2">Total Reviews</div>
          <div className="font-heading text-headline-xl text-on-surface">{totalReviews}</div>
        </div>

        {/* 👉 Reviews Published */}
        <div ref={addToStatsRef} className="bg-surface-container-lowest p-6 rounded-lg border border-surface-variant shadow-[0_4px_20px_-10px_rgba(141,75,0,0.05)]">
          <div className="text-on-surface-variant font-label-sm text-label-sm uppercase mb-2">Reviews Published</div>
          <div className="font-heading text-headline-xl text-on-surface">{publishedCount}</div>
        </div>

        {/* 👉 Reviews Pending */}
        <div ref={addToStatsRef} className="bg-surface-container-lowest p-6 rounded-lg border border-surface-variant shadow-[0_4px_20px_-10px_rgba(141,75,0,0.05)]">
          <div className="text-on-surface-variant font-label-sm text-label-sm uppercase mb-2">Reviews Pending</div>
          <div className="font-heading text-headline-xl text-primary">{pendingCount}</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-surface-container-lowest rounded-lg border border-surface-variant shadow-[0_8px_30px_-15px_rgba(141,75,0,0.08)] overflow-hidden">
        <div className="p-6 border-b border-surface-variant flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface gap-4">
          <h2 className="font-heading text-headline-md text-on-surface">Recent Feedback</h2>
          <div className="flex flex-wrap gap-2">
            {['All', '5 Stars', 'Pending'].map(filter => (
              <span
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setPage(1);
                }}
                className={`inline-flex items-center px-3 py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-colors ${activeFilter === filter ? 'bg-surface-container-high text-on-surface-variant' : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'}`}
              >
                {filter}
              </span>
            ))}
          </div>
        </div>

        <div className="divide-y divide-surface-variant">
          {filteredReviews.map((review) => {
            const initial = review.userName ? review.userName.charAt(0).toUpperCase() : 'U';
            const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            // Format status for UI display
            const isPublished = review.status === 'published';
            const displayStatus = isPublished ? 'Published' : 'Pending';

            return (
              <div
                key={review._id} // Assuming the backend returns _id for the review (if not, use review.userId + review.productId)
                ref={addToReviewsRef}
                className={`p-stack-md flex flex-col sm:flex-row gap-6 hover:bg-surface-bright transition-colors ${!isPublished ? 'bg-surface-container-low/30' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-heading text-headline-md">
                    {initial}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row justify-between items-start mb-2 gap-4">
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface">{review.userName || 'Anonymous'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-primary text-sm">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-on-surface-variant text-sm font-body-sm">{formattedDate}</span>
                      </div>
                      <div className="text-sm text-on-surface-variant mt-1">
                        Purchased: <span className="font-medium text-on-surface">{review.productName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Text */}
                      <span className={`font-label-sm text-label-sm uppercase tracking-wider ${isPublished ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {displayStatus}
                      </span>
                      {/* Status Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isPublished}
                          onChange={() => toggleStatus(review.productId, review._id, review.status || 'pending')}
                        />
                        <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-sm"></div>
                      </label>
                    </div>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface mt-3 max-w-3xl">
                    {review.comment}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredReviews.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              No reviews found matching your criteria.
            </div>
          )}
        </div>

        {/* Dynamic Pagination */}
        <div className="p-4 border-t border-surface-variant bg-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-on-surface-variant font-body-md">
            Showing {totalReviews === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, totalReviews)} of {totalReviews} reviews
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page * limit >= totalReviews}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Reviews;