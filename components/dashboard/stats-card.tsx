import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface Props {
  title: string;
  value: string;
}

export default function StatsCard({
  title,
  value,
}: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <p>{title}</p>

        <h2 className="text-3xl font-bold">
          {value}
        </h2>
      </CardContent>
    </Card>
  );
}