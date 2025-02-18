import React from "react";
import { Collapse, Timeline, Card, Image } from "antd";
import koiFishImage from "../../../assets/koiFishImage.png";
import sponsorLogo1 from "../../../assets/sponsorLogo1.png";
import sponsorLogo2 from "../../../assets/sponsorLogo2.png";
import koiMouthImage from "../../../assets/koiMouthImage.png";

function KoiShowDetail() {
  const { Panel } = Collapse;

  return (
    <div className="max-w-7xl mx-auto p-3">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Koi Fish Show 2025</h1>
        <p className="text-gray-600">
          Welcome to the annual Koi Fish Show, where enthusiasts gather to
          showcase their prized Koi and compete for top honors. Join us in
          celebrating the beauty and diversity of Koi fish.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Section - Image */}
        <div className="md:col-span-2">
          <Image
            src={koiFishImage}
            alt="Koi Fish"
            className="w-full rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="mt-4">
              <Collapse defaultActiveKey={["1"]}>
                <Panel header="Event Schedule" key="1">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>07/01/2025 - Registration Opens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>10/01/2025 - Registration Closes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>12/01/2025 - Exhibition Day</span>
                    </div>
                    <div className="flex justify-between">
                      <span>12/01/2025 - Tournament Opening Date</span>
                    </div>
                    <div className="flex justify-between">
                      <span>12/01/2025 - Tournament End Date</span>
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </div>

            <div className="mt-4">
              <Collapse defaultActiveKey={["2"]}>
                <Panel header="Ticket" key="2">
                  <div className="space-y-2">
                    <div>Competition Registration- Competition Entry - $5</div>
                    <div>Viewing Ticket - Basic Pass - $45</div>
                    <div>Competition Ticket - Vip Pass - $75</div>
                    <div>Exhibition Ticket - Exhibition Pass - $15</div>
                    <div>Minimum quantity: 100 - Maximum quantity: 200</div>
                  </div>
                </Panel>
              </Collapse>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Sponsor</h3>
              <div className="grid grid-cols-2 gap-4">
                <Image
                  src={sponsorLogo1}
                  alt="Sponsor 1"
                  className="rounded-xl"
                />
                <Image
                  src={sponsorLogo2}
                  alt="Sponsor 2"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Judging Criteria</h3>
              <div className="grid grid-cols-2 gap-10">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      1
                    </span>
                    <span>Color Quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      2
                    </span>
                    <span>Body and shape</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      3
                    </span>
                    <span>Pattern Balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      4
                    </span>
                    <span>Size & Growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      5
                    </span>
                    <span>Skin Quality</span>
                  </div>
                </div>
                {/* Column 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      6
                    </span>
                    <span>Overall Health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      7
                    </span>
                    <span>Finnage Quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      8
                    </span>
                    <span>Swimming Form</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      9
                    </span>
                    <span>Elegance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      10
                    </span>
                    <span>Uniqueness</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Status */}
        <div>
          <Card title="Status" className="mb-4">
            <Timeline
              items={[
                {
                  color: "gold",
                  children: (
                    <>
                      <div className="text-yellow-500 font-medium">
                        Not Registered
                      </div>
                      <div className="text-sm">22/08/2023- 15/08/2023</div>
                      <div className="text-sm">16:08 PM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "blue",
                  children: (
                    <>
                      <div className="text-blue-500 font-medium">
                        Can Register
                      </div>
                      <div className="text-sm">15/08/2023- 19/08/2023</div>
                      <div className="text-sm">00:08 AM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "orange",
                  children: (
                    <>
                      <div className="text-orange-500 font-medium">
                        Registration Ended
                      </div>
                      <div className="text-sm">19/08/2023- 20/08/2023</div>
                      <div className="text-sm">00:08 AM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "green",
                  children: (
                    <>
                      <div className="text-green-500 font-medium">
                        Application Review Ended
                      </div>
                      <div className="text-sm">20/08/2023- 21/08/2023</div>
                      <div className="text-sm">00:08 AM- 22:08 PM</div>
                    </>
                  ),
                },
                {
                  color: "purple",
                  children: (
                    <>
                      <div className="text-purple-500 font-medium">
                        Attendance Possible
                      </div>
                      <div className="text-sm">21/08/2023- 22/08/2023</div>
                      <div className="text-sm">22:08 PM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "cyan",
                  children: (
                    <>
                      <div className="text-cyan-500 font-medium">Started</div>
                      <div className="text-sm">22/08/2023- 22/08/2023</div>
                      <div className="text-sm">00:08 AM- 09:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "red",
                  children: (
                    <>
                      <div className="text-red-500 font-medium">Ended</div>
                      <div className="text-sm">22/08/2023</div>
                      <div className="text-sm">09:08 AM</div>
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex gap-4 border-t pt-4">
        {[
          "Category",
          "Koi List",
          "Manage Show",
          "Exhibitor",
          "Competition Rounds",
          "Votes",
          "Awards",
          "Rules",
          "Sponsor",
        ].map((item) => (
          <span
            key={item}
            className="text-gray-600 cursor-pointer hover:text-blue-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default KoiShowDetail;
