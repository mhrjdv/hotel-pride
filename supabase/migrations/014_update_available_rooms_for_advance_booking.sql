create or replace function get_available_rooms(
    p_check_in_date text,
    p_check_out_date text,
    p_check_in_time text,
    p_check_out_time text,
    p_room_type text
)
returns setof rooms
language plpgsql
as $$
declare
    v_check_in  timestamptz := (p_check_in_date || ' ' || p_check_in_time)::timestamptz;
    v_check_out timestamptz := (p_check_out_date || ' ' || p_check_out_time)::timestamptz;
begin
    return query
    select r.*
    from rooms as r
    where 
        r.room_type = p_room_type
        and r.status <> 'blocked'
        and not exists (
            select 1
            from bookings b
            where
                b.room_id = r.id
                and b.booking_status not in ('cancelled', 'no_show')
                and (
                    -- Convert booking dates and times to timestamps for accurate overlap check
                    (b.check_in_date || ' ' || b.check_in_time)::timestamptz,
                    (b.check_out_date || ' ' || b.check_out_time)::timestamptz
                ) overlaps (v_check_in, v_check_out)
        );
end;
$$; 