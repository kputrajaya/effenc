import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Select from 'react-select';

import { calculateEffEnc, fetcher, getEncDisplay, SHEET_URL } from './helpers';
import Item from './Item';

export default function App() {
  const [formEqu, setFormEqu] = useState();
  const [formEncs, setFormEncs] = useState([]);

  const { data: encData } = useSWR(`${SHEET_URL}/Enchantment`, fetcher);
  const { data: equData } = useSWR(`${SHEET_URL}/Equipment`, fetcher);

  const equOpts = useMemo(() => (equData ? equData.map((equ) => ({ value: equ, label: equ.name })) : []), [equData]);
  const encOpts = useMemo(() => {
    if (!formEqu?.value?.enchantments) return [];

    const equEncs = new Set(formEqu.value.enchantments.split(','));
    const incompatEncs = new Set(
      formEncs.flatMap((encOpt) => (encOpt.value.incompatible ? encOpt.value.incompatible.split(',') : []))
    );

    return encData
      .filter((enc) => equEncs.has(enc.id))
      .map((enc) => ({
        value: enc,
        label: getEncDisplay(enc),
        disabled: incompatEncs.has(enc.id),
      }))
      .sort((a, b) => a.disabled - b.disabled);
  }, [formEqu, formEncs, encData]);
  const effEnc = useMemo(() => calculateEffEnc(formEncs.map((encOpt) => encOpt.value)), [formEncs]);

  if (!encData || !equData) {
    return <div className="max-w-2xl mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="mb-4 text-xl font-bold">Minecraft Efficient Enchant</h1>
      <Select
        className="mb-2"
        placeholder="Select equipment..."
        options={equOpts}
        value={formEqu}
        onChange={(opt) => {
          setFormEqu(opt);
          setFormEncs([]);
        }}
      />
      <Select
        className="mb-4"
        placeholder="Select enchantments..."
        options={encOpts}
        isOptionDisabled={(opt) => opt.disabled}
        isMulti
        value={formEncs}
        onChange={(opts) => setFormEncs(opts)}
      />

      <h2 className="mb-4 text-lg font-bold">Combining Order</h2>
      {effEnc && (
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th>No</th>
                <th>Left</th>
                <th>Right</th>
                <th className="text-right">Level</th>
                <th className="text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {effEnc.steps.map((step, index) => (
                <tr key={`step-${index}`}>
                  <td>{index + 1}</td>
                  <td>
                    <Item equipment={formEqu.label} item={step.a} />
                  </td>
                  <td>
                    <Item equipment={formEqu.label} item={step.b} />
                  </td>
                  <td className="text-right">{step.levelCost}</td>
                  <td className="text-right">{step.xpCost}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th></th>
                <th colSpan="2">Total Cost</th>
                <th className="text-right">{effEnc.levelCost}</th>
                <th className="text-right">{effEnc.xpCost}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
