-- Función para reducir stock automáticamente
CREATE OR REPLACE FUNCTION reducir_stock(item_id UUID, cantidad INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE inventario
    SET stock_actual = GREATEST(stock_actual - cantidad, 0)
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;
