-- RPC to update bank account balance
CREATE OR REPLACE FUNCTION public.update_cuenta_saldo(cuenta_uuid UUID, delta_valor NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.cuentas_bancarias
    SET 
        saldo_actual = saldo_actual + delta_valor,
        updated_at = NOW()
    WHERE id = cuenta_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
