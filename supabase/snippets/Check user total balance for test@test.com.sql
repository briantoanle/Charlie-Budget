select
  date_trunc('month', txn_date) as month,
  sum(amount) as net_amount
from public.transactions t
join auth.users u on u.id = t.user_id
where u.email = 'test@test.com'
group by 1
order by 1;