create or replace function get_available_rooms(
    start_date text,
    end_date text
)
returns setof rooms
language sql
as $$
    select r.*
    from rooms r
    where
        r.status <> 'blocked' -- A room can be occupied now but available for future dates
        and not exists (
            select 1
            from bookings b
            where
                b.room_id = r.id
                and b.booking_status not in ('cancelled', 'no_show')
                and (
                    -- Exclude bookings that end on the new start_date or start on the new end_date
                    (b.check_in_date, b.check_out_date) overlaps (start_date::date, end_date::date)
                )
        );
$$; 