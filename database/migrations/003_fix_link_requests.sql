-- fix: remove unique constraint on link_requests to allow retry after rejection
-- also add index for performance
ALTER TABLE link_requests DROP CONSTRAINT IF EXISTS link_requests_requester_id_target_id_key;
CREATE INDEX IF NOT EXISTS idx_link_requests_pair ON link_requests(requester_id, target_id);
