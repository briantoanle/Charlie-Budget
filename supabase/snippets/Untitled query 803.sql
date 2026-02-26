select
  c.name,
  sum(t.amount) as total
from public.transactions t
join public.categories c on c.id = t.category_id
join auth.users u on u.id = t.user_id
where u.email = 'test@test.com'
  and t.txn_date >= '2026-02-01'
  and t.txn_date <  '2026-03-01'
group by c.name
order by total;