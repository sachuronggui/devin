import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

interface TimeDimensionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TimeDimensionSelector = ({ value, onChange }: TimeDimensionSelectorProps) => (
  <Tabs value={value} onValueChange={onChange} className="w-full">
    <TabsList className="grid w-full grid-cols-5">
      <TabsTrigger value="hour">小时</TabsTrigger>
      <TabsTrigger value="day">日</TabsTrigger>
      <TabsTrigger value="week">周</TabsTrigger>
      <TabsTrigger value="month">月</TabsTrigger>
      <TabsTrigger value="year">年</TabsTrigger>
    </TabsList>
  </Tabs>
);

export default TimeDimensionSelector;
