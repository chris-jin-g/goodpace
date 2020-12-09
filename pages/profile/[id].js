import { useRouter } from "next/router";

import Link from "next/link";
import { initFirebase, firebase } from "../../utils/auth/initFirebase";

import { useUser } from "../../utils/auth/useUser";
import { fetch } from "../../utils/data/fetcher";
import { capitalize } from "../../utils/common/index";

import { EditIcon, LinkedInIcon, TwitterIcon } from "../../components/Icons";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { IndexHeading } from "../../components/Intro";

import ContentEditable from "react-contenteditable";
import styled from "styled-components";

initFirebase();

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const updateUser = async (user, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    await response.json();
  } catch (error) {
    console.log(error);
  }
};

const FileDropZone = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;

  & input[type="file"] {
    position: absolute;
    width: 100px;
    height: 100px;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    cursor: pointer;
  }

  & .file-dummy {
    width: 120px;
    padding: 0;
    background: white;
    text-align: center;

    & .success {
      display: none;
    }
  }

  &:hover .file-dummy {
    /* background: rgba(255,255,255,0.1); */
    cursor: pointer;
  }

  input[type="file"]:focus + .file-dummy {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline: -webkit-focus-ring-color auto 5px;
  }

  input[type="file"]:valid + .file-dummy {
    border-color: rgba(0, 255, 0, 0.4);
    /* background-color: rgba(0,255,0,0.3); */
    background-color: purple;
    .success {
      display: inline-block;
    }
    .default {
      display: none;
    }
  }
`;

const Profile = ({ profile }) => {
  // if currentUser, use that
  let { user, logout } = useUser();
  const router = useRouter();
  // stop guessing profile if not exist
  if (!profile.createdAt) {
    return null;
  }
  // configure my own
  const viewingMyOwn = user && profile.id === user.id;
  const profileDisplayName = viewingMyOwn ? "(you)" : "";
  const profileIntro =
    profile.introduction ||
    `${profile.displayName} has chosen to remain mysterious about themselves.`;
  const profileInterests =
    JSON.stringify(profile.interests) ||
    `${profile.displayName} has a number of interests, but have chosen not to share with anyone.`;
  // update user email if need
  if (user && user.email !== profile.email) {
    console.log("updating email", user, profile);
    updateUser(user, { email: user.email });
  }
  // define profile path when requiring login
  const nextPath = router.asPath;

  return (
    <div className="container">
      <Header title="Hello, fellow path creator. Welcome to Pace!" />

      <main>
        <IndexHeading
          text="Profile"
          me={user && user.id}
          myAvatar={user && user.avatarSource}
          onClickMe={e => {
            e.preventDefault();
            console.log("go to my profile of", user.id);
            router.push(`/profile/${user.id}`);
          }}
        />

        <div className="profileHead">
          {viewingMyOwn ? (
            <div className="profileParticulars">
              <div>
                <img
                  className="profileImage"
                  id="profileAvatar"
                  src={profile.avatarSource}
                ></img>
              </div>
              <div className="profileImageCover">
                <FileDropZone
                  className="form-group file-area"
                  onChange={async evt => {
                    console.log("evt.target", evt);
                    const selectedFile = document.getElementById("newAvatar")
                      .files[0];
                    const storageRef = firebase.storage().ref();
                    const profileAvatarRef = storageRef.child(
                      `images/avatars/${user.id}`
                    );
                    const snap = await profileAvatarRef
                      .put(selectedFile)
                      .catch(error => {
                        console.log(error);
                      });
                    const avatarPath = await profileAvatarRef
                      .getDownloadURL()
                      .catch(console.error);
                    console.log("snap", snap, avatarPath);
                    document.getElementById("profileAvatar").src = avatarPath;
                    updateUser(user, { avatarSource: avatarPath });
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    name="newAvatar"
                    id="newAvatar"
                    required="required"
                    title="Click or drag an image for your profile photo"
                  />
                  <EditIcon className="icon" />
                  <div className="file-dummy">
                    <div className="success">
                      Your photo is selected. Please wait ...
                    </div>
                    <div className="default">120px x 120px</div>
                  </div>
                </FileDropZone>
              </div>
            </div>
          ) : (
            <div className="profileParticulars-notmine">
              <div>
                <img className="profileImage" src={profile.avatarSource}></img>
              </div>
            </div>
          )}
        </div>

        <div className="profileHead">
          {viewingMyOwn ? (
            <div className="profileParticulars">
              <ContentEditable
                id="profileName"
                className="profileName"
                html={profile.displayName}
                disabled={false}
                onKeyPress={evt => {
                  if (evt.key === "Enter") {
                    evt.preventDefault();
                    document.getElementById("profileName").blur();
                  }
                }}
                onBlur={evt => {
                  if (user.isAnonymous) {
                    router.push(`/join?nextPath=${nextPath}`);
                  }
                  console.log("evt target", evt.target, evt.target.textContent);
                  updateUser(user, { displayName: evt.target.textContent });
                }}
              />
              <p className="isYou">{profileDisplayName}</p>
            </div>
          ) : (
            <div className="profileParticulars-notmine">
              <div className="profileName">{profile.displayName}</div>
            </div>
          )}
        </div>

        <h3 className="profileSectionHead">Introduction</h3>
        {viewingMyOwn ? (
          <div className="profileParticulars">
            {/* <div className="profileText"><p>{profile.displayName} has chosen to remain mysterious about themselves.</p></div> */}
            <ContentEditable
              id="profileIntro"
              className="profileText"
              html={profileIntro}
              disabled={false}
              onKeyPress={evt => {
                if (evt.ctrlKey && evt.key === "Enter") {
                  evt.preventDefault();
                  document.getElementById("profileIntro").blur();
                }
              }}
              onBlur={evt => {
                if (user.isAnonymous) {
                  router.push(`/join?nextPath=${nextPath}`);
                }
                console.log("evt target", evt.target, evt.target.textContent);
                updateUser(user, { introduction: evt.target.textContent });
              }}
            />
          </div>
        ) : (
          <div className="profileParticulars-notmine">
            <div className="profileText">
              <p>{profileIntro}</p>
            </div>
          </div>
        )}

        <h3 className="profileSectionHead">Paths</h3>
        {profile &&
        (profile.paths.length > 0 || profile.pathsTaken.length > 0) ? (
          <div className="profileParticulars">
            <p>Building:</p>
            <ul>
              {profile.paths.map(p => {
                const goalTail = p.goalName.replace(/\s/g, "-");
                const buildPathUrl = `/build-path/${p.id}/${goalTail}`;
                return (
                  <li key={p.id}>
                    <Link href={buildPathUrl}>
                      <a>{capitalize(p.goalName)}</a>
                    </Link>
                  </li>
                );
              })}
              {profile.paths.length === 0 && (
                <li>{profile.displayName} has not built any paths yet</li>
              )}
            </ul>

            <p>Taking:</p>
            <ul>
              {profile.pathsTaken.map(p => {
                const goalTail = p.goalName.replace(/\s/g, "-");
                const takePathUrl = `/take-path/${p.originPath}/${goalTail}`;
                return (
                  <li key={p.id}>
                    <Link href={takePathUrl}>
                      <a>{capitalize(p.goalName)}</a>
                    </Link>
                  </li>
                );
              })}
              {profile.pathsTaken.length === 0 && (
                <li>{profile.displayName} has not taken any paths yet</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="profileParticulars">
            <p>This user has yet to publish a path of their own.</p>
          </div>
        )}

        {/* <h3 className="profileSectionHead">Interests</h3>
        {
          viewingMyOwn ?
          <div className="profileParticulars">            
            <ContentEditable
              id="profileInterest"
              className="profileText"
              html={profileInterests}
              disabled={false}
              onKeyUp={(evt) => {
                console.log('evt', evt)
              }}
              onBlur={(evt) => {
                if (user.isAnonymous) { router.push(`/join?nextPath=${nextPath}`) }
                console.log('evt target', evt.target, evt.target.textContent)
                updateUser(user, {"interests": evt.target.textContent})
              }}
            />
          </div>
          :
          <div className="profileParticulars-notmine">
            <div className="profileText"><p>{profileInterests}</p></div>
          </div>
        } */}

        {/* <hr />
        <div className="profileSocial">
          <span><LinkedInIcon onClick={() => { console.log('linkedin') }} /></span>
          <span><TwitterIcon onClick={() => { console.log('twitter') }} /></span>
        </div> */}
      </main>

      <Footer logout={logout} />
    </div>
  );
};

export async function getServerSideProps({ params }) {
  const userUrl = `${BASE_URL}/api/user/${params.id}`;
  try {
    const response = await fetch(userUrl);
    const profile = await response.json();

    profile.path = `/profile/${profile.id}`;

    const profilePathsQuery = await firebase
      .firestore()
      .collection("paths")
      .where("author", "==", profile.id)
      .get()
      .catch(error => {
        console.log(error);
        res.status(500).json({ message: "path query failed" });
      });
    if (!profilePathsQuery.docs) {
      res.status(404).json({ message: "no paths found" });
    }

    profile.paths = await profilePathsQuery.docs.map(path => {
      const pathData = path.data();
      return {
        id: path.id,
        goal: pathData.goal,
        goalName: pathData["goal:name"],
        createdAt: pathData.createdAt,
        duration: pathData["pace:duration"]
      };
    });

    const profilePathsTakenQuery = await firebase
      .firestore()
      .collection("paths:taken")
      .where("taker", "==", profile.id)
      .get()
      .catch(error => {
        console.log(error);
        res.status(500).json({ message: "path taken query failed" });
      });
    if (!profilePathsTakenQuery.docs) {
      res.status(404).json({ message: "no paths found" });
    }
    profile.pathsTaken = await profilePathsTakenQuery.docs.map(path => {
      const pathData = path.data();
      return {
        id: path.id,
        goal: pathData.goal,
        goalName: pathData["goal:name"],
        createdAt: pathData.createdAt,
        originPath: pathData.path
      };
    });

    return {
      props: { profile }
    };
  } catch (error) {
    console.log(error);
  }

  return { props: { profile: {} } };
}

export default Profile;
