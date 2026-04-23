drop policy if exists "Public update memory photos" on public.dashboard_memory_photos;
create policy "Public update memory photos"
  on public.dashboard_memory_photos
  for update
  using (true)
  with check (true);
