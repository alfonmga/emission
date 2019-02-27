import { Box, color, Flex, Sans, Separator } from "@artsy/palette"
import { SavedShowItemRow_show } from "__generated__/SavedShowItemRow_show.graphql"
import { SavedShowItemRowMutation } from "__generated__/SavedShowItemRowMutation.graphql"
import OpaqueImageView from "lib/Components/OpaqueImageView"
import Switchboard from "lib/NativeModules/SwitchBoard"
import { Schema, Track, track as _track } from "lib/utils/track"
import moment from "moment"
import React from "react"
import { TouchableWithoutFeedback } from "react-native"
import { commitMutation, createFragmentContainer, graphql, RelayProp } from "react-relay"
interface Props {
  show: SavedShowItemRow_show
  relay: RelayProp
}

const track: Track<Props, {}> = _track

@track()
class SavedShowItemRow extends React.Component<Props> {
  handleTap() {
    Switchboard.presentNavigationViewController(this, this.props.show.href || `show/${this.props.show.id}`)
  }

  @track(props => {
    const {
      show: { id: slug, _id, is_followed },
    } = props
    return {
      action_name: is_followed ? Schema.ActionNames.UnsaveShow : Schema.ActionNames.SaveShow,
      context_screen: Schema.PageNames.SavesAndFollows,
      owner_type: Schema.OwnerEntityTypes.Show,
      owner_id: _id,
      owner_slug: slug,
    } as any
  })
  handleSave() {
    const {
      show: { id: showSlug, __id: relayID, _id: showID, is_followed: isShowFollowed },
    } = this.props

    if (showID && showSlug && relayID) {
      return commitMutation<SavedShowItemRowMutation>(this.props.relay.environment, {
        mutation: graphql`
          mutation SavedShowItemRowMutation($input: FollowShowInput!) {
            followShow(input: $input) {
              show {
                id
                is_followed
                _id
              }
            }
          }
        `,
        variables: {
          input: {
            partner_show_id: showID,
            unfollow: isShowFollowed,
          },
        },
        optimisticResponse: {
          followShow: {
            show: {
              _id: showID,
              is_followed: !isShowFollowed,
              id: showSlug,
            },
          },
        },
        updater: store => {
          store.get(relayID).setValue(!isShowFollowed, "is_followed")
        },
      })
    }
  }

  render() {
    const { show } = this.props
    const imageURL = show.images[0] && show.images[0].url

    return (
      <TouchableWithoutFeedback onPress={this.handleTap.bind(this)}>
        <Box height="95" mx="20" mt="9">
          <Flex flexGrow="1" flexDirection="row" alignItems="center">
            <Box height="50" width="50" style={{ overflow: "hidden" }}>
              <OpaqueImageView width={50} height={50} imageURL={imageURL} />
            </Box>
            <Flex flexDirection="column" flexGrow="1" width="197">
              {show.partner &&
                show.partner.name && (
                  <Sans size="3" color="black" weight="medium" numberOfLines={1} ml="13">
                    {show.partner.name}
                  </Sans>
                )}
              {show.name && (
                <Sans size="2" color={color("black60")} ml="13" numberOfLines={1}>
                  {show.name}
                </Sans>
              )}
              {show.status && (
                <Sans size="2" color={color("black60")} ml="13">
                  {show.status.includes("closed")
                    ? show.status.charAt(0).toUpperCase() + show.status.slice(1)
                    : show.start_at &&
                      show.end_at &&
                      moment(show.start_at).format("MMM D") + " - " + moment(show.end_at).format("MMM D")}
                </Sans>
              )}
            </Flex>
            <TouchableWithoutFeedback onPress={() => this.handleSave()}>
              <Flex flexGrow="1">
                <Sans
                  weight="medium"
                  mb="30"
                  size="3"
                  color={show.is_followed ? color("black60") : color("purple100")}
                  textAlign="right"
                >
                  {show.is_followed ? "Saved" : "Save"}
                </Sans>
              </Flex>
            </TouchableWithoutFeedback>
          </Flex>
          <Separator />
        </Box>
      </TouchableWithoutFeedback>
    )
  }
}

export default createFragmentContainer(SavedShowItemRow, {
  show: graphql`
    fragment SavedShowItemRow_show on Show {
      id
      _id
      __id
      is_followed
      name
      partner {
        ... on Partner {
          name
        }
        ... on ExternalPartner {
          name
        }
      }
      href
      status
      images(size: 1) {
        url
      }
      start_at
      end_at
    }
  `,
})