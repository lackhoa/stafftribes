'use client';

import Image from 'next/image'
import { useState } from 'react';

type Data = Array<Array<boolean>>;

const range_7 = [0,1,2,3,4,5,6];
let globalCommittedWeekIndex = -1;
let globalCommittedDateIndex = -1;
let globalCommittedData : Data = range_7.map((i) => range_7.map((i) => false));  // 7x7 falses

function hasActiveSlot(): boolean {
  return globalCommittedWeekIndex >= 0;
}

// NOTE: #copy from https://stackoverflow.com/a/6117889/4279260
function getWeekNumber(d) {
  d = new Date(d.getTime());
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  // Calculate full weeks to nearest Thursday
  var weekIndexo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
  // Return array of year and week number
  return weekIndexo;
}

function addDays(date, offset) {
  let out = new Date(date);
  out.setDate(date.getDate() + offset);
  return out;
}

function DateSlot ({ date, month, weekIndex, dateIndex, data, setData }) {
  function handleMouse(event) {
    if (event.buttons == 1) {
      let available:boolean = !data[weekIndex][dateIndex];
      if (!hasActiveSlot()) {
        globalCommittedWeekIndex = weekIndex;
        globalCommittedDateIndex = dateIndex;
      }
      else {
        // override availability value;
        available = data[globalCommittedWeekIndex][globalCommittedDateIndex];
      }

      console.assert(hasActiveSlot());

      let startWeekIndex = Math.min(weekIndex, globalCommittedWeekIndex);
      let endWeekIndex = Math.max(weekIndex, globalCommittedWeekIndex);
      let startDateIndex = Math.min(dateIndex, globalCommittedDateIndex);
      let endDateIndex = Math.max(dateIndex, globalCommittedDateIndex);

      // NOTE: always start committed data
      let newData: Data = range_7.map((w) => range_7.map((d) => globalCommittedData[w][d]));
      // console.log(`${startWeekIndex}-${endWeekIndex} ${startDateIndex}-${endDateIndex}`);
      for (let w=startWeekIndex; w <= endWeekIndex; w++) {
        for (let d=startDateIndex; d <= endDateIndex; d++) {
          newData[w][d] = available;
        }
      }

      setData(newData)
    }
  }

  function format(number) {
    return ("0" + number).slice(-2)
  }

  let available:boolean = data[weekIndex][dateIndex];
  let className = "border border-slate-700 select-none hover:bg-sky-700";
  className += available ? " bg-green-900" : "";

  let today = new Date();
  let isSameDate = (today.getDate() == date) && (today.getMonth() == month);
  className += isSameDate ? " font-bold" : "";

  // NOTE: It's "month+1" because getMonth() is stupid
  return (
      <div onMouseEnter={handleMouse} onMouseDown={handleMouse} className={className}>
      {format(date)}/{format(month+1)}
      </div>
  )
};

function Week ({ firstDate, weekIndex, data, setData }) {
  let id = getWeekNumber(firstDate);
  let days = range_7.map((dateIndex) => {
    let date = addDays(firstDate, dateIndex);
    let date_prop = date.getDate();
    let month_prop = date.getMonth();
    return (
        <td className="m-2" key={dateIndex}>
        <DateSlot date={date_prop} month={month_prop} weekIndex={weekIndex} dateIndex={dateIndex} data={data} setData={setData}></DateSlot>
        </td>
    );
  });
  return (
    <>
      <td className="select-none border border-slate-500">{id}</td>
      {days}
    </>
  )
}

function Table({weeks}) {
  let headers = ["Week", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((header) => {
    return (<th className="border border-slate-500 select-none" key={header}>{header}</th>)
  });
  return (
      <table className="table-auto border-separate border-spacing-1">
        <tbody>
            <tr>{headers}</tr>
            {weeks.map((week) => (<tr key={week.props.weekIndex}>{week}</tr>))}
        </tbody>
      </table>
  )
};

export default function Home() {
  const today = new Date();
  let offset = (today.getDay() == 0) ? -6 : -(today.getDay() - 1);
  let thisMonday = addDays(today, offset);

  const [data, setData] = useState(globalCommittedData);
  document.addEventListener("mouseup", (event) => {
    // disable active slot
    globalCommittedWeekIndex = -1;
    globalCommittedDateIndex = -1;
    // commit data
    globalCommittedData = data;
  })

  // TODO: #perf #study Wouldn't all cells be rendered every time data changes?
  let weeks = range_7.map((weekIndex) => {
    let firstDate = addDays(thisMonday, weekIndex*7);
    return (
        <Week firstDate={firstDate} weekIndex={weekIndex} data={data} setData={setData}></Week>
    );
  })

  // TODO: #bug monday could be previous month, which wouldn't need its own section
  let months = [{month: thisMonday.getMonth(), weeks: []}];
  weeks.forEach((week) => {
    let firstDate = week.props.firstDate;
    let advanceMonth = false;
    let currentMonth = months[months.length-1];
    if (firstDate.getMonth() == currentMonth.month) {
      // still in current month
      months[months.length-1].weeks.push(week)
      let lastDate = addDays(firstDate, 6);
      if (lastDate.getMonth() > currentMonth.month) {
        advanceMonth = true;
      }
    } else {
      advanceMonth = true;
    }

    if (advanceMonth){
      // NOTE: the week will be added twice if it straddles between two months
      months.push({month: currentMonth.month+1, weeks: [week]});
    }
  })

  let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let tables = months.map((month) => (
      <div className="py-2" key={month.month}>
      <h1 className="mb-4 text-4xl">{monthNames[month.month]}</h1>
      <Table weeks={month.weeks}></Table>
      </div>
  ));

  return (
      <main className="min-h-screen flex-col p-24">
      {tables}
      </main>
  )
}
