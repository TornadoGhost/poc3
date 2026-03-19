# Database Schema

## Tables

### x_search_queries
- `id`: bigint unsigned [PK, AI]
- `session_id`: bigint unsigned [PK, FK -> sessions.id]
- `theme`: varchar(255)
- `policy`: varchar(255)
- `year`: varchar(5)
- `country`: varchar(5)
- `hashtag`: varchar(255)
- `query_hash`: varchar(255)
- `next_cursor`: varchar(2048)
- `status`: mediumint unsigned
- `attempt`: mediumint unsigned
- `exception`: text
- `created_at`: timestamp
- `updated_at`: timestamp
- `search_date_range`: varchar(255)

### x_tweets
- `id`: bigint unsigned [PK, AI]
- `session_id`: bigint unsigned [FK -> sessions.id]
- `query_id`: bigint unsigned [FK -> x_search_queries.id]
- `external_id`: bigint unsigned
- `post_text`: text
- `author`: varchar(255)
- `post_status`: varchar(255)
- `mentioned_users`: json
- `date_published`: timestamp
- `likes_count`: bigint unsigned
- `retweets_count`: bigint unsigned
- `replies_count`: bigint unsigned
- `views_count`: bigint unsigned
- `media_urls`: json
- `created_at`: timestamp
- `updated_at`: timestamp

## Relationships
- `x_tweets.query_id` -> `x_search_queries.id`
