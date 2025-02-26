import React from "react";
import { Badge, Card, Divider, Typography } from "antd";

// Dữ liệu giải thưởng
const awardsData = [
  {
    category: "Mini Kohaku",
    fishType: "Showa",
    size: "15-25cm",
    prize: "$10,000",
    trophy: true,
    winner: "Chưa có",
    referee: "Ông Messi",
    imageUrl:
      "https://aquariumcare.vn/upload/user/images/Thi%E1%BA%BFt%20k%E1%BA%BF%20ch%C6%B0a%20c%C3%B3%20t%C3%AAn.jpg",
  },
  {
    category: "Standard Showa",
    fishType: "Kohaku",
    size: "Dưới 10-15cm",
    prize: "$8,000",
    trophy: true,
    winner: "Chưa có",
    referee: "Ông Ronaldo",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KFBka8D7AW2kyC1JJe1sf5CfhjJFBu7NN723Ji8S2reehSpEMRG2bVN8H99yr264W3M&usqp=CAU",
  },
  {
    category: "Premium Taisho Sanke",
    fishType: "Sanke",
    size: "30-50 cm",
    prize: "$8,000",
    trophy: true,
    winner: "Chưa có",
    referee: "Ông Ronaldo",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2KFBka8D7AW2kyC1JJe1sf5CfhjJFBu7NN723Ji8S2reehSpEMRG2bVN8H99yr264W3M&usqp=CAU",
  },
  {
    category: "Grand Champion",
    fishType: "Kohaku",
    size: "10-15cm",
    prize: "$8,000",
    trophy: true,
    winner: "Chưa có",
    grandChampion: true,
    referee: "Ông Neymar",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR38wS6A72mmfDxo4MrbeufelTre9EC1TRnlB2g-OqKGP0sIZ_rq1zXk07dJjN40Li_7MM&usqp=CAU",
  },
];

const { Title, Text } = Typography;

const Awards = () => {
  return (
    <div className="max-w-6xl mx-auto p-3">
      {awardsData.map((award, index) => (
        <Card
          key={index}
          className={`mb-6 p-4 ${
            award.grandChampion ? "bg-yellow-300" : "bg-white"
          } rounded-lg border ${
            award.grandChampion ? "border-yellow-500" : "border-gray-300"
          } shadow-md`}
          title={
            <div className="flex justify-between items-center text-lg font-semibold text-gray-800">
              <span>{award.category}</span>
              {award.trophy && (
                <Badge
                  count="Cúp"
                  style={{ backgroundColor: "#f7c100", fontWeight: "bold" }}
                />
              )}
            </div>
          }
        >
          <div className="flex justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={award.imageUrl}
                alt={award.category}
                className="w-[6rem] h-50 object-cover rounded-md"
              />
              <div>
                <p className="text-gray-700 text-lg">
                  {award.fishType} - Kích thước {award.size}
                </p>
                <p className="text-lg text-green-500">Giải thưởng: {award.prize}</p>
              </div>
            </div>
            <div className="text-lg flex-end">Người thắng: {award.winner}</div>
          </div>

          <Divider className="my-4" />
          <div className="text-center">
            <Text strong>Trọng tài: {award.referee}</Text>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Awards;
