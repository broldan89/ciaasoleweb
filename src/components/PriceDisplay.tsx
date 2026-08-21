interface PriceDisplayProps {
  precio: number;
  esMayorista: boolean;
}

// Este componente ya no decide qué precio mostrar ni consulta el rol del
// usuario: recibe el precio ya resuelto del servidor (obtener_precio_variante)
// y solo se encarga de mostrarlo. Antes leía `user_metadata.rol`, un campo
// editable por el propio usuario desde el navegador — ese chequeo nunca
// debe volver a vivir acá.
export default function PriceDisplay({ precio, esMayorista }: PriceDisplayProps) {
  return (
    <div className="mt-4">
      <span className="text-2xl font-bold">${precio}</span>
      {esMayorista && (
        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          Precio mayorista
        </span>
      )}
    </div>
  );
}
