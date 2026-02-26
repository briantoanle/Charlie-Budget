select u.email,
       a.name as account,
       t.txn_date,
       t.amount,
       c.name as category,
       t.merchant
from public.transactions t
join public.accounts a on a.id = t.account_id
left join public.categories c on c.id = t.category_id
join auth.users u on u.id = t.user_id
where u.email = 'test@test.com'
order by t.txn_date desc;