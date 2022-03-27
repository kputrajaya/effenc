import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Select from 'react-select';

import Item from './Item';

export default function App() {
  const [formEqu, setFormEqu] = useState();
  const [formEncs, setFormEncs] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [steps, setSteps] = useState();

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: encData } = useSWR(
    'https://opensheet.elk.sh/1jVwBONNQYHBehcw_LbfVzaKOkbGqd6CJighwQvpdKBk/Enchantment',
    fetcher
  );
  const { data: equData } = useSWR(
    'https://opensheet.elk.sh/1jVwBONNQYHBehcw_LbfVzaKOkbGqd6CJighwQvpdKBk/Equipment',
    fetcher
  );

  const equOpts = useMemo(() => (equData ? equData.map((equ) => ({ value: equ, label: equ.name })) : []), [equData]);
  const encOpts = useMemo(() => {
    if (!encData || !formEqu?.value?.enchantments) return [];

    const equEncs = new Set(formEqu.value.enchantments.split(','));
    const incompatEncs = new Set(
      formEncs.flatMap((encOpt) => (encOpt.value.incompatible ? encOpt.value.incompatible.split(',') : []))
    );
    return encData
      .filter((enc) => equEncs.has(enc.id))
      .map((enc) => ({
        value: enc,
        label: enc.max === '1' ? enc.name : `${enc.name} ${{ 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }[enc.max]}`,
        disabled: incompatEncs.has(enc.id),
      }))
      .sort((a, b) => a.disabled - b.disabled);
  }, [formEqu, formEncs, encData]);

  const calculate = () => {
    setCalculating(true);
    const worker = new window.Worker('/worker.js');
    worker.postMessage({ encs: formEncs.map((encOpt) => encOpt.value) });
    worker.onmessage = (e) => {
      const { result, duration } = e.data;
      console.log(`Calculating steps took ${duration} ms`);
      setSteps(result);
      setCalculating(false);
      worker.terminate();
    };
  };

  const render = () => {
    if (!encData || !equData) {
      return <div className="text-neutral-500 italic">Loading...</div>;
    }

    return (
      <>
        <Select
          className="mb-2"
          placeholder="Select equipment..."
          options={equOpts}
          value={formEqu}
          onChange={(opt) => {
            setFormEncs([]);
            setFormEqu(opt);
          }}
        />
        <Select
          className="mb-2"
          placeholder="Select enchantments..."
          isMulti
          closeMenuOnSelect={false}
          blurInputOnSelect={false}
          options={encOpts}
          isOptionDisabled={(opt) => opt.disabled}
          value={formEncs}
          onChange={(opts) => setFormEncs(opts)}
        />
        <button
          className="mb-6 py-2 px-4 bg-emerald-700 text-sm text-white font-bold uppercase rounded"
          onClick={calculate}
        >
          Calculate
        </button>

        {calculating && <div className="text-neutral-400 italic">Calculating...</div>}
        {!calculating && steps && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Combining Steps</h2>
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
                {steps.steps.map((step, index) => (
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
                  <th className="text-right">{steps.levelCost}</th>
                  <th className="text-right">{steps.xpCost}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </>
    );
  };
  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="mb-6 text-xl text-emerald-800 font-bold">Minecraft Efficient Enchant</h1>
      {render()}
    </div>
  );
}
