-- List all policies for storage.objects
SELECT 
    pol.policyname,
    pol.tablename,
    pol.permissive,
    pol.roles,
    pol.cmd,
    pol.qual,
    pol.with_check
FROM pg_policies pol
WHERE pol.schemaname = 'storage'
AND pol.tablename = 'objects'
ORDER BY pol.policyname; 