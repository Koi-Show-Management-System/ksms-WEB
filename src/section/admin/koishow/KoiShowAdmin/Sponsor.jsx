import React from "react";
import { Card, Row, Col, Tag, Button } from "antd";
import { GlobalOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import sponsor1 from "../../../../assets/sponsorLogo1.png";
import sponsor2 from "../../../../assets/sponsorLogo2.png";
const sponsors = [
  {
    id: 1,
    name: "Koi Palace",
    type: "Platinum",
    typeColor: "gold",
    description:
      "Leading supplier of high-quality koi fish and pond equipment. Supporting the koi community for over 20 years.",
    image: sponsor1,
    website: "https://example.com",
    email: "contact@koipalace.com",
    phone: "+1234567890",
  },
  {
    id: 2,
    name: "Aqua Systems",
    type: "Gold",
    typeColor: "orange",
    description:
      "Specialized in advanced filtration systems and pond maintenance solutions for koi enthusiasts.",
    image: sponsor2,
    website: "https://example.com",
    email: "info@aquasystems.com",
    phone: "+1234567890",
  },
];

const Sponsor = () => {
  return (
    <Row gutter={[16, 16]}>
      {sponsors.map((sponsor) => (
        <Col xs={24} sm={12} lg={8} key={sponsor.id}>
          <Card
            hoverable
            className="h-full"
            cover={
              <img
                alt={sponsor.name}
                src={sponsor.image}
                className="h-48 object-cover"
              />
            }
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{sponsor.name}</h2>
                <Tag color={sponsor.typeColor}>{sponsor.type}</Tag>
              </div>

              <p className="text-gray-600">{sponsor.description}</p>

              <div className="flex gap-2">
                <Button
                  type="primary"
                  icon={<GlobalOutlined />}
                  href={sponsor.website}
                  target="_blank"
                >
                  Website
                </Button>
                <Button
                  icon={<MailOutlined />}
                  href={`mailto:${sponsor.email}`}
                >
                  Email
                </Button>
                <Button icon={<PhoneOutlined />} href={`tel:${sponsor.phone}`}>
                  Call
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default Sponsor;
