'use client';

import { CreatorProfile, formatCreatorNumber, getPlatformInfo } from '@/lib/creator-aggregator';

interface CreatorProfileCardProps {
  rank: number;
  creator: CreatorProfile;
  onClick?: () => void;
}

export function CreatorProfileCard({ rank, creator, onClick }: CreatorProfileCardProps) {
  const topPlatform = creator.platforms[0] || 'instagram';
  const platformInfo = getPlatformInfo(topPlatform);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
    >
      {/* Header: Rank and Creator Info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Rank Badge */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platformInfo.color} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
          #{rank}
        </div>

        {/* Creator Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {creator.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {/* VIEWS - PRIMARY METRIC (large, prominent) */}
            <span className="text-2xl font-extrabold text-gray-900">
              {formatCreatorNumber(creator.totalViews)}
            </span>
            <span className="text-sm text-gray-500 font-medium">views</span>
            {/* Followers - SECONDARY (smaller) */}
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 font-medium">{formatCreatorNumber(creator.followers)} followers</span>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex gap-1 flex-shrink-0">
          {creator.platforms.map((platform) => {
            const info = getPlatformInfo(platform);
            return (
              <span
                key={platform}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-sm shadow-sm`}
                title={platform}
              >
                {info.icon}
              </span>
            );
          })}
        </div>
      </div>

      {/* Best Performing Post - Combined recent + top */}
      {creator.topPost && (
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Best Performing Post
          </div>
          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
            {creator.topPost.content.summary}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="font-semibold text-purple-600">{formatCreatorNumber(creator.topPost.metrics.views)} views</span>
            <span>{(creator.topPost.metrics.likes + creator.topPost.metrics.comments + creator.topPost.metrics.shares).toLocaleString()} engagements</span>
          </div>

          {/* AI Insight Section */}
          {creator.insight ? (
            <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-semibold text-blue-800 uppercase">What worked</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{creator.insight}</p>
            </div>
          ) : (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-gray-500 uppercase">AI Insight</span>
              </div>
              <p className="text-xs text-gray-500 italic">Insight will be generated during data import</p>
            </div>
          )}

          {creator.topPost.postUrl && (
            <a
              href={creator.topPost.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
            >
              View Post
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
