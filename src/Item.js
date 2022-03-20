export default function Item({ equipment, item }) {
  return (
    <div className="inline-block">
      <div>
        <span>{item.isEqu ? equipment : 'Book'}</span>
        <span className="text-neutral-500">&nbsp;({item.cost})</span>
      </div>
      <div className="text-sm text-neutral-500">
        {item.encs.map((enc, index) => (
          <div key={`enc-${index}`}>{enc}</div>
        ))}
      </div>
    </div>
  );
}
